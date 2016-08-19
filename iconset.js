( function() {

    var VERSION = 2;

    window.ASCIIcon = {};

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    ASCIIcon.IconSet = function( option ) {
        this.VERSION = VERSION;
        this.nextid = 1;
        this.set = [ new ASCIIcon.Icon( { name: this.newName() } ) ];
        this.selected = 0;
    }

    ASCIIcon.IconSet.prototype.newName = function() {
        return 'New-' + this.nextid++
    }

    ASCIIcon.IconSet.prototype.addIcon = function( icon ) {
        this.set.push( icon );
        this.selected = this.set.length - 1;
    }

    ASCIIcon.IconSet.prototype.getIcons = function() {
        return this.set;
    }

    ASCIIcon.IconSet.prototype.selectIcon = function( index ) {
        if ( index < 0 || index >= this.set.length ) throw 'out of range';
        this.selected = index;
    }

    ASCIIcon.IconSet.prototype.getSelectedIcon = function() {
        return this.set[ this.selected ];
    }

    ASCIIcon.IconSet.prototype.save = function( name ) {
        localStorage.setItem( name, JSON.stringify( this ) )
    }

    ASCIIcon.IconSet.prototype.load = function( name ) {
        try {
            var json = localStorage.getItem( name ),
                data = JSON.parse( json );

            if ( !data ) throw 'no data'
            if ( !data.VERSION ) throw 'no VERSION'

            return this[ 'constructV' + data.VERSION ]( data )
        }
        catch( e ) {
            console.warn( e );
            return false;
        }
    }

    ASCIIcon.IconSet.prototype.constructV1 = function( data ) {
        data.set = $.map( data.set, function ( icon ) {
            return new ASCIIcon.Icon( {
                    name:   icon.name,
                    cols:   icon.option.gridSize,
                    rows:   icon.option.gridSize,
                    mod:    icon.option.gridMod,
                    left:   icon.option.iconLeft,
                    top:    icon.option.iconTop,
                    width:  icon.option.iconWidth,
                    height: icon.option.iconHeight,            
                },
                icon.vertices,
                icon.segments
            );
        } )
        $.extend( this, data );
        this.VERSION = VERSION;

        return true;
    }

    ASCIIcon.IconSet.prototype.constructV2 = function( data ) {
        data.set = $.map( data.set, function ( icon ) {
            return new ASCIIcon.Icon( icon.option, icon.vertices, icon.segments );
        } )
    
        $.extend( this, data );

        return true;
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    ASCIIcon.Icon = function( option, vertices, segments ) {
        this.option = $.extend( {
            name:   null,
            cols:   15,
            rows:   15,
            mod:    4,
            left:   null,
            top:    null,
            width:  null,
            height: null,
        }, option || {} );

        if ( !vertices ) {
            var grid = [];
            for ( var r = 0; r < this.option.rows; r++ ) {
                var row = '';
                for ( var c = 0; c < this.option.cols; c++ )
                    row = row + this.placeHolder( c, r );
                grid.push( row );
            }        

            vertices = grid.join( '\n' );
        }

        this.vertices = vertices;
        this.segments = segments || '';
    }

    ASCIIcon.Icon.prototype.placeHolder = function( x, y ) {
        return ((x + 1) % this.option.mod == 0) && ((y + 1) % this.option.mod == 0) ? ':' : '.';
    }

    ASCIIcon.Icon.prototype.toText = function() {
        return JSON.stringify( this.option ) + '\n\n' + 
            this.vertices + '\n\n' + 
            this.segments
    }

    ASCIIcon.Icon.prototype.fromText = function( text ) {
        var m = text.match( /^(.+?)\n+([^]+)\n\n+([^]+)$/ )
        if ( !m ) return false;

        var o;
        try {
            o = JSON.parse( m[ 1 ] );
        } 
        catch ( e ) {
            return false
        }

        this.option = o;
        this.vertices = m[ 2 ];
        this.segments = m[ 3 ]
    }

} )()
