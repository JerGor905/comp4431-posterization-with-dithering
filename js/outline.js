(function(imageproc) {
    "use strict";

    /*
     * Apply sobel edge to the input data
     */
    imageproc.sobelEdge = function(inputData, outputData, threshold) {
        console.log("Applying Sobel edge detection...123");

        /* Initialize the two edge kernel Gx and Gy */
        var Gx = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        var Gy = [
            [-1,-2,-1],
            [ 0, 0, 0],
            [ 1, 2, 1]
        ];

        /**
         * TODO: You need to write the code to apply
         * the two edge kernels appropriately
         */

        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
        var xsum = 0;
        var ysum = 0
                var i = (x + y * outputData.width) * 4;
                for(var kx=-1; kx<=1 ; kx++ ){
                    for(var ky=-1; ky<=1 ; ky++){
                        var pixel = imageproc.getPixel(inputData,x+kx,y+ky);
                        xsum += (pixel.r+pixel.g+pixel.b)/3*Gx[ky+1][kx+1];
                        ysum += (pixel.r+pixel.g+pixel.b)/3*Gy[ky+1][kx+1];
                    }
                }
                var magnitude = Math.hypot(xsum, ysum);

                // Applying the threshold
                var edgeValue = magnitude > threshold ? 255 : 0;
                outputData.data[i]     = edgeValue;
                outputData.data[i + 1] = edgeValue;
                outputData.data[i + 2] = edgeValue;
            }
        }
    } 

}(window.imageproc = window.imageproc || {}));
