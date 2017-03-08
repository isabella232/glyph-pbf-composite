'use strict';

var compile = require('pbf/compile');
var fs = require('fs');

var messages = compile(fs.readFileSync(__dirname + '/proto/glyphs.proto'));
console.log(messages);

function debug(buffer, decode) {
    if (decode) buffer = messages.decode(buffer);

    return JSON.stringify(buffer, function(k, v) {
        if (k !== 'bitmap') return v;
        return v ? v.data.length : v;
    }, 2);
}

/**
 * Combine any number of glyph (SDF) PBFs.
 * Returns a re-encoded PBF with the combined
 * font faces, composited using array order
 * to determine glyph priority.
 * @param {array} buffers An array of SDF PBFs.
 */
function combine(buffers, fontstack) {
    var result,
        coverage = {};
    
    if (!buffers || buffers.length === 0) return;

    buffers.forEach(function(buf) {
        var decoded = messages.decode(buf);
        var glyphs = decoded.stacks[0].glyphs;
        if (!result) {
            glyphs.forEach(function(glyph) {
                coverage[glyph.id] = true;
            });
            result = decoded;
        } else {
            glyphs.forEach(function(glyph) {
                if (!coverage[glyph.id]) {
                    result.stacks[0].glyphs.push(glyph);
                    coverage[glyph.id] = true;
                }
            });
            result.stacks[0].name += ', ' + decoded.stacks[0].name;
        }
    });
    if (fontstack) result.stacks[0].name = fontstack;

    result.stacks[0].glyphs.sort(function(a, b) { return a.id - b.id; });

    return messages.encode(result);
}

module.exports = {
    combine: combine,
    debug: debug,
    encode: messages.encode,
    decode: messages.decode
};
