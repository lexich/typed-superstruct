import create, { Validator, TAccessModifiers } from './'


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

  describe('is', () => {
    it('valid', () => {
      const obj = validator.build({
        attributes: {
          text: 'text',
          bool: true,
          textOrNumber: 1,
        }
      });

      const result = validator.is(obj);
      expect(result).toBe(true);
    });

    it('invalid', () => {
      const result = validator.is({ message: 'invalid'});
      expect(result).toBe(false);
    });
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
      expect(() => validator.assert(obj)).not.toThrowError();
    });

    it('invalid', () => {
      const obj = { attributes: { message: 'invalid' }};
      expect(() => validator.assert(obj)).toThrowError('attributes.text');
    });
  });

  describe('Custom validator', () => {
    type TUUID = `${number}-${number}-${number}-${number}`;
    class UUID<M extends TAccessModifiers> extends Validator<TUUID, M> {
      test(t: any): t is TUUID {
        return /^\d{4}-\d{4}-\d{4}-\d{4}$/.test(t);
      }
    }

    const validator = create(t => t.object({
      uuid: new UUID()
    }));

    it('test object with uuid', () => {
      const obj = validator.build({
        uuid: '1234-1234-1234-1234'
      });
      expect(validator.is(obj)).toBe(true);
    });

    it('invalid test', () => {
      expect(validator.is({})).toBe(false);
    });
  })
});





