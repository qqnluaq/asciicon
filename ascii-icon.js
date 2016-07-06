// ascii icon

// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . b . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . c . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . a . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .  
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .


// A line ab   // line a -> b
// C arc ab c // arc from a-b, center c
// C bezier ab cd // bezier from a to d, control points b & c
// A circle ab   // circle centered at a, radius ab 
// A rect ab // rect with corners a & b

// stroke ABC style1 // stroke line ABC with colour 
// fill ABC style2 // fill & stroke poly ABC with colour 

CanvasRenderingContext2D.prototype.drawIcon = function ( icon, option ) {
    var left     = option.left     || 0,
        top      = option.top      || 0,
        width    = option.width,
        height   = option.height,
        debugGrid     = option.grid     || false,
        debugSegments = option.segments || false;

    var lines  = icon.split( /\n/ );
        cols   = 0,
        rows   = 0,
        vertex = {},
        i      = 0,
        guideRows = [],
        guideCols = [];


    for ( ; i < lines.length; i++ ) {
        points = lines[ i ].trim().split( /\s+/ );
        if ( points.length == 1 && !points[ 0 ] ) {
            rows = i;
            break;
        }

        cols = Math.max( cols, points.length );

        for ( var j = 0; j < points.length; j++ ) {
            if ( /^[.:#]$/.test( points[ j ] ) ) {
                if ( points[ j ] == ':' ) {
                    guideRows[ i ] = true;
                    guideCols[ j ] = true;
                }
                continue;
            }

            if ( vertex[ points[ j ] ] ) {
                console.log( 'vertex "' + points[ j ] + '" appears more than once' );
                continue;
            }

            vertex[ points[ j ] ] = {
                x: j,
                y: i
            }
        }
    }

    if ( !width ) width = cols;
    if ( !height ) height = rows;

    if ( cols > width )
        throw 'Cannot have more columns than pixel width';

    if ( rows > height )
        throw 'Cannot have more rows than pixel height';
    
    var pixelsPerCol = width / cols,
        pixelsPerRow = height / rows,
        cellCenter   = [ pixelsPerCol / 2, pixelsPerRow / 2 ];

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    var segment = {},
        paths = [];

    for ( i++; i < lines.length; i++ ) {
        var line = lines[ i ].trim();
        if ( !line ) continue;

        var s = parseSegment( i, line, this.segmentMethod );
        if ( s ) {
            segment[ s.id ] = s;
            continue;
        }

        var p = parsePath( i, line, this.pathMethod );
        if ( p ) {
            paths.push( p );
            continue;
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    if ( debugGrid && Math.min( pixelsPerCol, pixelsPerRow ) >= 5 ) 
        drawGrid( this );

    this.save();
    this.beginPath();
    this.segmentMethod.rect.call( this, transform( [ 0, 0, cols, rows ], [ 0, 0 ] ) );
    this.clip();

    var styleContext = {
        pixelsPerCol: pixelsPerCol,
        pixelsPerRow: pixelsPerRow,         
    };

    for ( var p = 0; p < paths.length; p++ ) {
        var path = paths[ p ];

        this.beginPath();

        this.styleMethod[ path.style || 'default' ].call( this, styleContext )

        for ( var s = 0; s < path.segments.length; s++ ) {
            var seg = path.segments[ s ];

            this.segmentMethod[ seg.method ].call( this, transform( seg.vertices, cellCenter ) );
        }

        this.pathMethod[ path.method ].call( this )
    }

    if ( debugSegments )
        drawSegments( this, segment )

    this.restore();

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function transform( vertices, offset ) {
        var vs = [];
        for ( var i = 0 ; i < vertices.length; i += 2 ) {
            vs.push(
                left + vertices[ i     ] * pixelsPerCol + offset[ 0 ], 
                top  + vertices[ i + 1 ] * pixelsPerRow + offset[ 1 ]
            );
        }
        return vs;
    }

    function drawGrid( ctx ) {
        ctx.lineWidth = 1;
        ctx.setLineDash( [ 1, 1 ] );
        ctx.strokeStyle = 'gray';
        ctx.beginPath();
        var offset = [ 0, 0 ];
        for ( var i = 0 ; i <= cols ; i++ ) {
            if ( guideCols[ i ] )
                drawGuide( ctx, i, 0, 1, rows )
            ctx.moveTo.apply( ctx, transform( [ i,    0 ], offset ) )
            ctx.lineTo.apply( ctx, transform( [ i, rows ], offset ) )
        }
        for ( var i = 0 ; i <= rows ; i++ ) {
            if ( guideRows[ i ] )
                drawGuide( ctx, 0, i, cols, 1 )
            ctx.moveTo.apply( ctx, transform( [ 0,    i ], offset ) )
            ctx.lineTo.apply( ctx, transform( [ cols, i ], offset ) )
        }
        ctx.stroke();
    }

    function drawGuide( ctx, c, r, w, h ) {
        var vs = transform( [ c, r, c + w, r + h ], [ 0, 0 ] );
        ctx.fillStyle = 'darkgray';
        ctx.fillRect( vs[ 0 ], vs[ 1 ], vs[ 2 ] - vs[ 0 ], vs[ 3 ] - vs[ 1 ] );
    }

    function drawSegments( ctx, segment ) {
        for ( var sid in segment ) {
            var s = segment[ sid ];

            ctx.beginPath();
            ctx.styleMethod.debugSegments.call( ctx )
            ctx.segmentMethod[ s.method ].call( ctx, transform( s.vertices, cellCenter ) );            
            ctx.stroke();
        }
    }

    function parseSegment( i, line, segmentMethod ) {
        var m = line.match( /^(\S)\s+(\S+)\s+(.+)$/ );
        if ( !m )
            return;

        var id        = m[ 1 ],
            method    = m[ 2 ],
            vertexIds = m[ 3 ].split( /\s*/ ),
            vertices  = [];

        if ( segment[ id ] ) {
            console.log( 'segment "' + id + '" appears more than once' );
            return;
        }

        if ( !segmentMethod[ method ] ) {
            console.log( 'segment line method invalid: ' + (i + 1) + ': "' + line + '"' );
            return;
        }

        for ( var j = 0; j < vertexIds.length; j++ ) {
            var v = vertex[ vertexIds[ j ] ]
            if ( !v ) {
                console.log( 'vertex "' + vertexIds[ j ] + '" not defined' )
                continue;
            }

            vertices.push( v.x, v.y )
        }

        if ( vertices.length == 0 ) {
            console.log( 'segment line invalid, no vertices defined: ' + (i + 1) + ': "' + line + '"' );
            return;
        }

        return {
            id: id,
            method:   method,
            vertices: vertices
        }
    }

    function parsePath( i, line, pathMethod ) {
        var m = line.match( /^(\S+)\s+(\S+)(.*)$/ );
        if ( !m )
            return;

        var method     = m[ 1 ],
            segmentIds = m[ 2 ].split( /\s*/ ),
            style      = m[ 3 ].trim(),
            segments   = [];

        if ( !pathMethod[ method ] ) {
            console.log( 'path line method invalid: ' + (i + 1) + ': "' + line + '"' );
            return;   
        }
            
        for ( var j = 0; j < segmentIds.length; j++ ) {
            var s = segment[ segmentIds[ j ] ];
            if ( !s ) {
                console.log( 'segment "' + segmentIds[ j ] + '" not defined' )
                continue;
            }

            segments.push( s )
        }

        if ( segments.length == 0 ) {
            console.log( 'path line invalid, no segments defined: ' + (i + 1) + ': "' + line + '"' );
            return;
        }        

        return {
            method:   method,
            segments: segments,
            style:    style
        };
    }
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

CanvasRenderingContext2D.prototype.segmentMethod = {
    line: function ( vs ) {
        this.moveTo( vs[ 0 ], vs[ 1 ] );
        for ( var i = 2; i < vs.length ; i+=2 ) 
            this.lineTo( vs[ i ], vs[ i + 1 ] );
    },
    arc: function ( vs ) {
        this.arcTo( );
    },
    circle: function ( vs ) {
        var r = Math.hypot( vs[ 0 ] - vs[ 2 ], vs[ 1 ] - vs[ 3 ] );
        this.arc( vs[ 0 ], vs[ 1 ], r, 0, 2 * Math.PI );
    },
    rect: function ( vs ) {
        this.rect( Math.min( vs[ 0 ], vs[ 2 ] ), Math.min( vs[ 1 ], vs[ 3 ] ), Math.abs( vs[ 0 ] - vs[ 2 ] ), Math.abs( vs[ 1 ] - vs[ 3 ] ) );
    },
};

CanvasRenderingContext2D.prototype.pathMethod = {
    fill: function () {
        this.fill();
    },
    stroke: function () {
        this.stroke();
    },
};

( function () {
    CanvasRenderingContext2D.prototype.styleMethod = {
        default: colourStyle( 'black' ),
        black: colourStyle( 'black' ),
        white: colourStyle( 'white' ),
        gray:  colourStyle( 'gray' ),
        red:  colourStyle( 'red' ),
        debugSegments: function () {
            this.lineWidth = 2;
            this.setLineDash( [ 2, 2 ] );
            this.strokeStyle = 'black';
        }
    };

    function colourStyle( colour ) {
        return function ( styleCtx ) {
            this.lineWidth = Math.min( styleCtx.pixelsPerRow, styleCtx.pixelsPerCol )
            this.lineCap = 'round';
            this.strokeStyle = colour;
            this.fillStyle = colour;
        }
    }
} )();
