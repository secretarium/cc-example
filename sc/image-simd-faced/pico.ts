import { COMPARATOR } from "util/sort";
import { CascadeParams, CascadeProgressOutput, ImageInfo } from "./types";
import { Notifier } from "@klave/sdk";

let tdepth = 0;
let ntrees = 0;
let tcodes = new Int8Array(0);
let tpreds = new Float32Array(0);
let thresh = new Float32Array(0);

export function unpackCascade(bytes: Int8Array): void {
    //
    const dview = new DataView(new ArrayBuffer(4));
    /*
        we skip the first 8 bytes of the cascade file
        (cascade version number and some data used during the learning process)
    */
    let p = 8;
    /*
        read the depth (size) of each tree first: a 32-bit signed integer
    */
    dview.setUint8(0, bytes[p + 0]);
    dview.setUint8(1, bytes[p + 1]);
    dview.setUint8(2, bytes[p + 2]);
    dview.setUint8(3, bytes[p + 3]);
    tdepth = dview.getInt32(0, true);
    p = p + 4
    /*
        next, read the number of trees in the cascade: another 32-bit signed integer
    */
    dview.setUint8(0, bytes[p + 0]);
    dview.setUint8(1, bytes[p + 1]);
    dview.setUint8(2, bytes[p + 2]);
    dview.setUint8(3, bytes[p + 3]);
    ntrees = dview.getInt32(0, true);
    p = p + 4
    /*
        read the actual trees and cascade thresholds
    */
    const tcodes_ls: u8[] = [];
    const tpreds_ls: f32[] = [];
    const thresh_ls: f32[] = [];

    for (let t = 0; t < ntrees; ++t) {

        // read the binary tests placed in internal tree nodes
        for (let i = 0, k = 4; i < k; ++i)
            tcodes_ls.push(0);

        const byteSlice = bytes.slice(p, p + 4 * i32(Math.pow(2, tdepth)) - 4);
        for (let i = 0, k = byteSlice.length; i < k; ++i)
            tcodes_ls.push(byteSlice[i]);

        p = p + 4 * i32(Math.pow(2, tdepth)) - 4;

        // read the prediction in the leaf nodes of the tree
        for (let i = 0; i < Math.pow(2, tdepth); ++i) {
            dview.setUint8(0, bytes[p + 0]);
            dview.setUint8(1, bytes[p + 1]);
            dview.setUint8(2, bytes[p + 2]);
            dview.setUint8(3, bytes[p + 3]);
            tpreds_ls.push(dview.getFloat32(0, true));
            p = p + 4;
        }
        // read the threshold
        dview.setUint8(0, bytes[p + 0]);
        dview.setUint8(1, bytes[p + 1]);
        dview.setUint8(2, bytes[p + 2]);
        dview.setUint8(3, bytes[p + 3]);
        thresh_ls.push(dview.getFloat32(0, true));

        p = p + 4;
    }

    tcodes = new Int8Array(tcodes_ls.length);
    tcodes.set(tcodes_ls);
    tpreds = new Float32Array(tpreds_ls.length);
    tpreds.set(tpreds_ls);
    thresh = new Float32Array(thresh_ls.length);
    thresh.set(thresh_ls);
}

// construct the classification function from the read data
function classifyRegion(r: i32, c: i32, s: f64, pixels: i32[], ldim: i32): f64 {
    r = 256 * r;
    c = 256 * c;
    let root = 0;
    let o = 0.0;
    const pow2tdepth = i32(Math.pow(2, tdepth)) >> 0; // '>>0' transforms this number to int

    for (let i = 0; i < ntrees; ++i) {
        let idx = 1;
        for (let j = 0; j < tdepth; ++j)
            // we use '>> 8' here to perform an integer division: this seems important for performance
            idx = 2 * idx + (
                pixels[
                    (i32(r + tcodes[root + 4 * idx + 0] * s) >> 8) * ldim +
                    (i32(c + tcodes[root + 4 * idx + 1] * s) >> 8)
                ] <= pixels[
                    (i32(r + tcodes[root + 4 * idx + 2] * s) >> 8) * ldim +
                    (i32(c + tcodes[root + 4 * idx + 3] * s) >> 8)
                    ] ? 1 : 0);

        o = o + tpreds[pow2tdepth * i + idx - pow2tdepth];

        if (o <= thresh[i])
            return -1;

        root += 4 * pow2tdepth;
    }
    return o - thresh[ntrees - 1];
}

export function runCascade(image: ImageInfo, params: CascadeParams): f64[][] {
    const pixels = image.pixels;
    const nrows = image.nrows;
    const ncols = image.ncols;
    const ldim = image.ldim;

    const shiftfactor = params.shiftfactor;
    const minsize = params.minsize;
    const maxsize = params.maxsize;
    const scalefactor = params.scalefactor;

    let scale: f64 = minsize;
    const detections: number[][] = [];

    while (scale <= maxsize) {
        const step = i32(Math.max(shiftfactor * scale, 1)) >> 0; // '>>0' transforms this number to int
        const offset = i32(scale / 2 + 1) >> 0;

        const progress = 1000 * scale / (maxsize - minsize)
        Notifier.sendJson<CascadeProgressOutput>({
            progress: progress > 100 ? 100 : progress
        });

        for (let r = offset; r <= nrows - offset; r += step) {

            for (let c = offset; c <= ncols - offset; c += step) {
                const q = classifyRegion(r, c, scale, pixels, ldim);
                if (q > 0.0)
                    detections.push([r, c, scale, q]);
            }
        }

        scale = scale * scalefactor;
    }

    return detections;
}


/*
    this helper function calculates the intersection over union for two detections
*/
function calculateIoU(det1: f64[], det2: f64[]): f64 {
    // unpack the position and size of each detection
    const r1 = det1[0], c1 = det1[1], s1 = det1[2];
    const r2 = det2[0], c2 = det2[1], s2 = det2[2];
    // calculate detection overlap in each dimension
    const overr = Math.max(0, Math.min(r1 + s1 / 2, r2 + s2 / 2) - Math.max(r1 - s1 / 2, r2 - s2 / 2));
    const overc = Math.max(0, Math.min(c1 + s1 / 2, c2 + s2 / 2) - Math.max(c1 - s1 / 2, c2 - s2 / 2));
    // calculate and return IoU
    return overr * overc / (s1 * s1 + s2 * s2 - overr * overc);
}

export function clusterDetections(dets: f64[][], iouthreshold: f64): f64[][] {
    /*
        sort detections by their score
    */
    const detections = dets.sort(function (a: f64[], b: f64[]) {
        // return b[3] - a[3];
        // return i32(b[3]) - i32(a[3]);
        return COMPARATOR<f64>()(a[3], b[3]);
    });
    /*
        do clustering through non-maximum suppression
    */
    const assignments = new Array<i32>(detections.length).fill(0);
    const clusters: f64[][] = [];
    for (let i = 0; i < detections.length; ++i) {
        // is this detection assigned to a cluster?
        if (assignments[i] == 0) {
            // it is not:
            // now we make a cluster out of it and see whether some other detections belong to it
            let r = 0.0, c = 0.0, s = 0.0, q = 0.0, n = 0;
            for (let j = i; j < detections.length; ++j)
                if (calculateIoU(detections[i], detections[j]) > iouthreshold) {
                    assignments[j] = 1;
                    r = r + detections[j][0];
                    c = c + detections[j][1];
                    s = s + detections[j][2];
                    q = q + detections[j][3];
                    n = n + 1;
                }
            // make a cluster representative
            clusters.push([r / n, c / n, s / n, q]);
        }
    }

    return clusters;
}
