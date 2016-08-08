( function() {

    var VERSION = 1;

    window.ASCIIcon = {};

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    ASCIIcon.IconSet = function( option ) {
        this.VERSION = VERSION;
        this.nextid = 1;
        this.set = [ new ASCIIcon.Icon( this.newName() ) ];
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
        var json = localStorage.getItem( name );
        try {
            var data = JSON.parse( json );
            if ( !data || !data.VERSION ) return false;
            if ( data.VERSION != VERSION ) {
                console.warn( 'wrong version');
                return false;
            }
        }
        catch( e ) {
            console.warn( e );
            return false;
        }

        $.extend( this, data );
        return true;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    ASCIIcon.Icon = function( name, option ) {
        this.name = name;
        this.option = $.extend( {
            gridSize:   15,
            gridMod:    4,
            iconWidth:  200,
            iconHeight: 200,
            iconLeft:   0,
            iconTop:    0,
        }, option || {} );

        var grid = [];
        for ( var r = 0; r < this.option.gridSize; r++ ) {
            var row = '';
            for ( var c = 0; c < this.option.gridSize; c++ )
                row = row + this.placeHolder( c, r );
            grid.push( row );
        }
        
        this.vertices = grid.join( '\n' );
        this.segments = '';
    }

    ASCIIcon.Icon.prototype.placeHolder = function( x, y ) {
        return ((x + 1) % this.option.gridMod == 0) && ((y + 1) % this.option.gridMod == 0) ? ':' : '.';
    }

} )()
