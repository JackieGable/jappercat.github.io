/*
 # -----------------------------------------------------------------------------
 #  ~/js/adapter/index.js
 #  Provides an empty object for later loaded adapter objects
 #
 #  Product/Info:
 #  https://jekyll.one
 #
 #  Copyright (C) 2021 Juergen Adams
 #
 #  J1 Template is licensed under MIT License.
 #  See: https://github.com/jekyll-one-org/J1 Template/blob/master/LICENSE
 # -----------------------------------------------------------------------------
*/
'use strict';

// -----------------------------------------------------------------------------
// ESLint shimming
// -----------------------------------------------------------------------------
/* eslint indent: "off"                                                       */
/* eslint no-unused-vars: "off"                                               */
/* eslint no-undef: "off"                                                     */


module.exports = function adapter ( options ) {

  return {

    // -------------------------------------------------------------------------
    // _init_
    // Global initializer for the adapter object
    // -------------------------------------------------------------------------
    _init_: function () {
      return
    }  // END _init_

  }; // end return (object)

//}( j1, window );
}( j1, window );
