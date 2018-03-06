declare namespace Chai {
  interface Assertion {
    roughly: RoughAssertion;
  }
}

interface RoughAssertion extends Chai.Assertion {
  (tolerance: number): Chai.Assertion;
}
