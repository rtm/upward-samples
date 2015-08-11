// sam/Ran.js
//
// Sample for range-type input elemnet.


import {E, U, T, F, V} from 'upward/src/Up';

var dom;


/// ### Sliders
///
/// A slider is just an `input` element with type `range`.
/// The `true` parameter to `.sets` causes the value to be updated in real time.
/// The `V` sets up a single upwardable value.
/// Here, we tie the slider value to font size.


//===START
var size = V(12);
var style = { fontSize: F`${size}pt` };
setTimeout(() => { console.log(style); console.log(style.fontSize); }, 1000);

dom = E('div') . has([
  E('span') . has("Sample text") . is(U({ style })),

  E('input') .
    is({ type: 'range', min: 6, max: 48, value: 12 }) .
    sets(size, true),

  F`Size: ${style.fontSize}`
]);
//===END


export default dom;
