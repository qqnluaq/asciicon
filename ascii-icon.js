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
    var lines         = icon.trim().split( /\n/ );
        lineIndex          = 0,
        vertex        = {},
        guideRows     = [],
        guideCols     = [],
        inlineOption  = {};
        debugGrid     = option.grid     || false,
        debugSegments = option.segments || false;

    try {
        inlineOption = JSON.parse( lines[0] );
        for ( lineIndex += 1 ; lineIndex < lines.length ; lineIndex++ ) 
            if ( lines[ lineIndex ] ) break;
    }
    catch ( e ) {}

    var name          = inlineOption.name     || option.name     || 0,          
        cols          = inlineOption.cols     || option.cols,
        rows          = inlineOption.rows     || option.rows,
        left          = inlineOption.left     || option.left     || 0,
        top           = inlineOption.top      || option.top      || 0,
        width         = inlineOption.width    || option.width    || 200,
        height        = inlineOption.height   || option.height   || 200;

    var detectedRows = 0,
        detectedCols = 0;

    for ( ; lineIndex < lines.length; lineIndex++ ) {
        var points = lines[ lineIndex ].trim().split( /\s*/ );
        if ( points.length == 0 || (points.length == 1 && !points[ 0 ]) ) {
            break;
        }

        detectedRows += 1;
        detectedCols = Math.max( detectedCols, points.length );

        for ( var j = 0; j < points.length; j++ ) {
            if ( /^[.:#]$/.test( points[ j ] ) ) {
                if ( points[ j ] == ':' ) {
                    guideRows[ lineIndex ] = true;
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
                y: lineIndex
            }
        }
    }

    if ( !cols ) cols = detectedCols;
    if ( !rows ) rows = detectedRows;
    if ( cols != detectedCols || rows != detectedRows )
        console.warn( 'size of vertex grid different than declaration' )

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

    for ( lineIndex++; lineIndex < lines.length; lineIndex++ ) {
        var line = lines[ lineIndex ].trim();
        if ( !line ) continue;

        var s = parseSegment( line, lineIndex, this.segmentMethod );
        if ( s ) {
            segment[ s.id ] = s;
            continue;
        }

        var p = parsePath( line, lineIndex, this.pathMethod );
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
        drawSegments( this, segment, vertex, styleContext )

    this.restore();

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function transform( vertices, offset ) {
        var vs = [];
        for ( var line = 0 ; line < vertices.length; line += 2 ) {
            vs.push(
                left + vertices[ line     ] * pixelsPerCol + offset[ 0 ], 
                top  + vertices[ line + 1 ] * pixelsPerRow + offset[ 1 ]
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
        for ( var line = 0 ; line <= cols ; line++ ) {
            if ( guideCols[ line ] )
                drawGuide( ctx, line, 0, 1, rows )
            ctx.moveTo.apply( ctx, transform( [ line,    0 ], offset ) )
            ctx.lineTo.apply( ctx, transform( [ line, rows ], offset ) )
        }
        for ( var line = 0 ; line <= rows ; line++ ) {
            if ( guideRows[ line ] )
                drawGuide( ctx, 0, line, cols, 1 )
            ctx.moveTo.apply( ctx, transform( [ 0,    line ], offset ) )
            ctx.lineTo.apply( ctx, transform( [ cols, line ], offset ) )
        }
        ctx.stroke();
    }

    function drawGuide( ctx, c, r, w, h ) {
        var vs = transform( [ c, r, c + w, r + h ], [ 0, 0 ] );
        ctx.fillStyle = 'darkgray';
        ctx.fillRect( vs[ 0 ], vs[ 1 ], vs[ 2 ] - vs[ 0 ], vs[ 3 ] - vs[ 1 ] );
    }

    function drawSegments( ctx, segment, vertex, styleContext ) {
        for ( var sid in segment ) {
            var s = segment[ sid ];

            for ( var l = 0; l < 2; l++ ) {
                if ( ctx.segmentMethod[ s.method + 'Construction' ] ) {
                    ctx.beginPath();
                    ctx.styleMethod.debugSegments.call( ctx, l, 2, 1 )
                    ctx.segmentMethod[ s.method + 'Construction' ].call( ctx, transform( s.vertices, cellCenter ) );                                
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.styleMethod.debugSegments.call( ctx, l, 4, 2 )
                ctx.segmentMethod[ s.method ].call( ctx, transform( s.vertices, cellCenter ) );            
                ctx.stroke();
            }
        }

        var radius = Math.min( styleContext.pixelsPerRow, styleContext.pixelsPerCol ) / 2 - 1;

        for ( var vid in vertex ) {
            var v = vertex[ vid ];

            for ( var l = 0; l < 2; l++ ) {
                ctx.beginPath();
                ctx.styleMethod.debugSegments.call( ctx, l, 2, 1 )
                var a = transform( [ v.x, v.y ], cellCenter )
                a.push( radius, 0, 2 * Math.PI )
                ctx.arc.apply( ctx, a );
                // ctx.rect.apply( ctx, transform( [ v.x, v.y, 1, 1 ], cellCenter ) );            
                ctx.stroke();
            }
        }
    }

    function parseSegment( line, index, segmentMethod ) {
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
            console.log( 'segment line method invalid: ' + (index + 1) + ': "' + line + '"' );
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
            console.log( 'segment line invalid, no vertices defined: ' + (index + 1) + ': "' + line + '"' );
            return;
        }

        return {
            id: id,
            method:   method,
            vertices: vertices
        }
    }

    function parsePath( line, index, pathMethod ) {
        var m = line.match( /^(\S+)\s+(\S+)(.*)$/ );
        if ( !m )
            return;

        var method     = m[ 1 ],
            segmentIds = m[ 2 ].split( /\s*/ ),
            style      = m[ 3 ].trim(),
            segments   = [];

        if ( !pathMethod[ method ] ) {
            console.log( 'path line method invalid: ' + (index + 1) + ': "' + line + '"' );
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
            console.log( 'path line invalid, no segments defined: ' + (index + 1) + ': "' + line + '"' );
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

// ( function () {

    CanvasRenderingContext2D.prototype.segmentMethod = {
        line: function ( vs ) {
            this.moveTo( vs[ 0 ], vs[ 1 ] );
            for ( var line = 2; line < vs.length ; line+=2 ) 
                this.lineTo( vs[ line ], vs[ line + 1 ] );
        },

        arc: function ( vs ) {
            var c = threePointCircleCenter( vs ),
                r = Math.hypot( c[ 0 ] - vs[ 2 ], c[ 1 ] - vs[ 3 ] ),
                a1 = Math.atan2( vs[ 1 ] - c[ 1 ], vs[ 0 ] - c[ 0 ] ),
                a2 = Math.atan2( vs[ 5 ] - c[ 1 ], vs[ 4 ] - c[ 0 ] );

            if ( c[2] )
                this.arc( c[0], c[1], r, a1, a2 )
            else
                this.arc( c[0], c[1], r, a2, a1 )
        },
        arcConstruction: function ( vs ) {
            var c = threePointCircleCenter( vs );
            for ( line = 0; line < 6; line+=2 ) {
                this.moveTo( vs[ line ], vs[ line+1 ] );
                this.lineTo( c[ 0 ], c[ 1 ] );

            }
        },
        
        circle: function ( vs ) {
            var r = Math.hypot( vs[ 0 ] - vs[ 2 ], vs[ 1 ] - vs[ 3 ] );

            this.arc( vs[ 0 ], vs[ 1 ], r, 0, 2 * Math.PI );
        },
        circleConstruction: function ( vs ) {
            this.moveTo( vs[ 0 ], vs[ 1 ] );
            this.lineTo( vs[ 2 ], vs[ 3 ] );
        },
        
        rect: function ( vs ) {
            this.rect( Math.min( vs[ 0 ], vs[ 2 ] ), Math.min( vs[ 1 ], vs[ 3 ] ), Math.abs( vs[ 0 ] - vs[ 2 ] ), Math.abs( vs[ 1 ] - vs[ 3 ] ) );
        },

        curve: function ( vs ) {
            this.moveTo( vs[ 0 ], vs[ 1 ] );
            this.bezierCurveTo( vs[ 2 ], vs[ 3 ], vs[ 4 ], vs[ 5 ], vs[ 6 ], vs[ 7 ] )
        },
        curveConstruction: function ( vs ) {
            this.moveTo( vs[ 0 ], vs[ 1 ] );
            this.lineTo( vs[ 2 ], vs[ 3 ] );
            this.moveTo( vs[ 4 ], vs[ 5 ] );
            this.lineTo( vs[ 6 ], vs[ 7 ] );
        }

    };

    function threePointCircleCenter( vs ) {
        var X1 = vs[2] - vs[0],
            Y1 = vs[3] - vs[1],
            X2 = vs[4] - vs[0],
            Y2 = vs[5] - vs[1],
            Z1 = X1 * X1 + Y1 * Y1,
            Z2 = X2 * X2 + Y2 * Y2,
            D  = 2 * (X1 * Y2 - X2 * Y1);

        if ( Math.abs(D) < 1e-9 )
            throw 'colinear'

        return [
            ( Z1 * Y2 - Z2 * Y1 ) / D + vs[0],
            ( X1 * Z2 - X2 * Z1 ) / D + vs[1],
            D > 0
        ]
    }

// } )();

CanvasRenderingContext2D.prototype.pathMethod = {
    fill: function () {
        this.fill();
    },
    stroke: function () {
        this.stroke();
    },
    paint: function () {
        this.fill();
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
        debugSegments: function ( layer, dash, width ) {
            this.lineWidth = width;
            this.lineCap = 'butt';
            this.lineJoin = 'bevel';
            if ( layer == 0 ) {
                this.setLineDash( [] );
                this.strokeStyle = 'white';
            }
            else if ( layer == 1 ) {
                this.setLineDash( [ dash, dash ] );
                this.strokeStyle = 'black';
            }
        }
    };

    function colourStyle( colour ) {
        return function ( styleCtx ) {
            this.setLineDash( [] );
            this.lineWidth = Math.min( styleCtx.pixelsPerRow, styleCtx.pixelsPerCol )
            this.lineCap = 'round';
            this.lineJoin = 'round';
            this.strokeStyle = colour;
            this.fillStyle = colour;
        }
    }

} )();
