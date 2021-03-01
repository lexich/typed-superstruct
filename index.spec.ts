import create from './'


describe('test', () => {
  const validator = create(T =>
    T.object({
      attributes: T.object({
        text: T.string(),
        num: T.number('?'),
        bool: T.boolean('r'),
        textOrNumber: T.compose(T.string, T.number),
      }),
    }),
  );
  type Type = ReturnType<typeof validator.build>;

  it('build', () => {
    const obj: Type = {
      attributes: {
        text: 'text',
        bool: true,
        textOrNumber: 1,
      },
    };
    const t = validator.build(obj);
    expect(t).toBe(obj);
  });

  describe('assert', () => {
    it('valid', () => {
      const obj = validator.build({
        attributes: {
          text: 'text',
          bool: true,
          textOrNumber: 1,
        }
      });

      const result = validator.assert(obj);
      expect(result).toBe(true);
    });

    it('invalid', () => {
      const result = validator.assert({ message: 'invalid'});
      expect(result).toBe(false);
    });
  });
});





