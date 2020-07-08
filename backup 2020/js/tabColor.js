function magic(th, algo, loadAll) {
    var imgWidth  = 18;
    var imgHeight = 18;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    // Draw white Rect to avoid problems with favicon opacity
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, imgWidth, imgHeight);

    ctx.drawImage( th, 0, 0, imgWidth, imgHeight);
    try {
        var data = ctx.getImageData(0, 0, imgWidth, imgHeight);
    }
    catch(e) {
        // security error, img on diff domain
        console.log("Cross-domain error");
        return;
    }

    if(loadAll) {
        var _answer = [],
            rgb= [];
        _answer.push(avgYUV( data ));
        _answer.push(euclideanDistance( data ));
        _answer.push(kClusters( data ));

        for (var i = 0; i < 3; i++) {
            rgb.push(String("rgb(" + _answer[i].r + ", " + _answer[i].g + ", " + _answer[i].b + ")"))
        };
        return rgb;

    } else {
        var rgb = algo( data );
        //var rgb = avg( data );
        //var rgb = avgYUV( data );
        //var rgb = euclideanDistance( data );
        //var rgb = kClusters( data );

        var colorString = String("rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")");
        $(th).parent().parent().css("background-color", colorString);
        // return colorString;
    }
}

function avg( data ) {
    var rgb = { r : 0, g : 0, b : 0 };
    var count = 0;
    for ( i = 0; i<data.data.length; i=i+4 ) {
        // Ignore white color. Suppose we hate it.
        if ( data.data[i]     == 255 && 
             data.data[i + 1] == 255 && 
             data.data[i + 2] == 255 ) {
            continue;
        }    

        rgb.r += data.data[i];
        rgb.g += data.data[i + 1];
        rgb.b += data.data[i + 2];                

        count += 1;
    }

    rgb.r = ~~(rgb.r/count);
    rgb.g = ~~(rgb.g/count);
    rgb.b = ~~(rgb.b/count);

    return rgb;
}

function sigma( x ) {
    return x / (Math.abs(x) + 0.4);
}

function avgYUV( data ) {
    var rgb = { r : 0, g : 0, b : 0 };
    var yuv = { y : 0, u : 0, v : 0 };
    var count = 0;
    for ( i = 0; i<data.data.length; i=i+4 ) {
        // Ignore white color. Suppose we hate it.
        if ( data.data[i]     == 255 && 
             data.data[i + 1] == 255 && 
             data.data[i + 2] == 255 ) {
            continue;
        }    

        rgb.r = data.data[i] / 255;
        rgb.g = data.data[i + 1] / 255;
        rgb.b = data.data[i + 2] / 255;
        
        yuv.y +=  0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        yuv.u += -0.147 * rgb.r - 0.289 * rgb.g + 0.436 * rgb.b;
        yuv.v +=  0.615 * rgb.r - 0.515 * rgb.g - 0.100 * rgb.b;
        
        count += 1;
    }
    
    yuv.y = yuv.y/count;
    yuv.u = yuv.u/count;
    yuv.v = yuv.v/count;
    
    yuv.y = sigma(yuv.y);
    yuv.u = sigma(yuv.u);
    yuv.v = sigma(yuv.v);
    
    rgb.r = yuv.y + 1.3983 * yuv.v;
    rgb.g = yuv.y - 0.3946 * yuv.u - 0.58060 * yuv.v;
    rgb.b = yuv.y + 2.0321 * yuv.u;
    
    rgb.r = ~~(rgb.r * 255);
    rgb.g = ~~(rgb.g * 255);
    rgb.b = ~~(rgb.b * 255);
    
    return rgb;
}

function euclideanDistance( data ) {
    var rgb = { r : 0, g : 0, b : 0 };
    var distances = Array();
    for ( var i = 0; i < data.data.length; i=i+4 ) {

        // Ignore white color. Suppose we hate it.
        if ( data.data[i]     == 255 && 
             data.data[i + 1] == 255 && 
             data.data[i + 2] == 255 ) {
            continue;
        }                    

        var dist = 0;
        var count = 0;
        for ( var j = 0; j < data.data.length; j=j+4 ) {

            if ( i == j ) continue;                    

            // Ignore white color. Suppose we hate it.
            if ( data.data[j]     == 255 && 
                 data.data[j + 1] == 255 && 
                 data.data[j + 2] == 255 ) 
                continue;

            var d = { r : 0, g : 0, b : 0 };
            d.r = data.data[i] - data.data[j];
            d.g = data.data[i + 1] - data.data[j + 1];
            d.b = data.data[i + 2] - data.data[j + 2];                    

            dist += Math.sqrt( d.r*d.r + d.g*d.g + d.b*d.b );
            count += 1;
        }

        var pixel = new Object();
        pixel.p = i;
        pixel.d = ~~(dist/count);                        
        distances.push( pixel ); 
    }
    
    distances.sort( function(a, b) { return a.d - b.d });
    
    var topPixel = distances[0];
    rgb.r = data.data[ topPixel.p ];
    rgb.g = data.data[ topPixel.p + 1 ];
    rgb.b = data.data[ topPixel.p + 2 ];

    return rgb;
}

function kClusters( data ) {
    var k = 5;

    var clusters = [];
    var tmpCenters = [];
    for(i=0; i<data.data.length; i=i+4) {

        // Ignore white color. Suppose we hate it.
        if ( data.data[i]     == 255 && 
             data.data[i + 1] == 255 && 
             data.data[i + 2] == 255 ) {
            continue;
        }

        var rgb = {};
        rgb.r = data.data[i];
        rgb.g = data.data[i + 1];
        rgb.b = data.data[i + 2];

        // Check for dublicates pixels
        if ( ($.grep( tmpCenters, function( e ) { return e.r == rgb.r && e.g == rgb.g && e.b == rgb.b })).length != 0 ) continue;

        tmpCenters.push( rgb );

        var cluster = new Object();
        cluster.center = rgb;
        cluster.pixels = [];
        cluster.sum    = { r : 0, g : 0, b : 0 };

        clusters.push( cluster );
        if ( clusters.length == k ) break;
    }    

    var iters = 0;
    var f = true;
    while( f ) {
        for(var i=0; i<data.data.length; i=i+4) {

            if ( data.data[i]     == 255 && 
                 data.data[i + 1] == 255 && 
                 data.data[i + 2] == 255 ) {
                continue;
            }

            var rgb = {};
            rgb.r = data.data[ i ];
            rgb.g = data.data[ i + 1 ];
            rgb.b = data.data[ i + 2 ];

            whichCluster = -1;
            minDist = Number.MAX_VALUE;
            for(var j=0; j<clusters.length; j++) {
                //Calculate dist
                d = {};
                d.r = rgb.r - clusters[j].center.r;
                d.g = rgb.g - clusters[j].center.g;
                d.b = rgb.b - clusters[j].center.b;

                dist = Math.sqrt( d.r*d.r + d.g*d.g + d.b*d.b );

                if ( dist < minDist ) {
                    minDist = dist;
                    whichCluster = j;
                }

            }

            // Add pixel to appropriate cluster
            clusters[whichCluster].pixels.push( rgb );
            // Prepare for recalculation clusters centers
            clusters[whichCluster].sum.r += rgb.r;
            clusters[whichCluster].sum.g += rgb.g;
            clusters[whichCluster].sum.b += rgb.b;
        }

        //Recalculate clusters centers
        for(var i=0; i<clusters.length; i++) {
            // Clonning object
            clusters[i].lastCenter = $.extend({}, clusters[i].center);
            clusters[i].center.r   = ~~(clusters[i].sum.r / clusters[i].pixels.length);
            clusters[i].center.g   = ~~(clusters[i].sum.g / clusters[i].pixels.length);
            clusters[i].center.b   = ~~(clusters[i].sum.b / clusters[i].pixels.length);

            if ( clusters[i].lastCenter.r == clusters[i].center.r &&
                 clusters[i].lastCenter.g == clusters[i].center.g &&
                 clusters[i].lastCenter.b == clusters[i].center.b ) 
            {
                // Stop clustering
                f = false;
            }
            else {
                f = true;
            }
        }

        iters += 1;
    }

    clusters.sort( function(a, b) { return b.pixels.length - a.pixels.length });
    rgb = clusters[0].center;

    return rgb;
}