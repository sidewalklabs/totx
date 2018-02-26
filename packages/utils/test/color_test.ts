import {expect} from 'chai';

import {rgba} from '../colors';

describe('colors', () => {
  it('should convert to rgba', () => {
    expect(rgba('#ff0000', 0.75)).to.equal('rgba(255,0,0,0.75)');
    expect(rgba('#007f00', 0.75)).to.equal('rgba(0,127,0,0.75)');
  });
});
