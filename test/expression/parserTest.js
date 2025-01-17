"use strict";

const { parse, split } = require("../../lib/expression/parser");

describe("expression parser", () => {
  describe("Identifier", () => {
    it("throws if unclosed", () => {
      const input = "$(someVar";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError);
    });
  });

  describe("MemberExpression", () => {
    it("happy trail", () => {
      const input = "$(someVar{'a'})";
      expect(parse(input)).to.deep.equal({
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "someVar",
        },
        property: {
          type: "Literal",
          value: "a",
          loc: {
            source: "'a'",
            start: { line: 1, column: 10 },
            end: { line: 1, column: 13 },
          },
        },
        loc: {
          source: "$(someVar{'a'})",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 15 },
        },
      });
    });

    it("property as Identifier", () => {
      const input = "$(someVar{$(someName)})";
      expect(parse(input)).to.deep.equal({
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "someVar",
        },
        property: {
          type: "Identifier",
          name: "someName",
          loc: {
            source: "$(someName)",
            start: { line: 1, column: 10 },
            end: { line: 1, column: 21 },
          },
        },
        loc: {
          source: "$(someVar{$(someName)})",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 23 },
        },
      });
    });

    it("property as MemberExpression", () => {
      const input = "$(someVar{$(someName{'b'})})";
      expect(parse(input)).to.deep.contain({
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "someVar",
        },
        property: {
          type: "MemberExpression",
          object: {
            type: "Identifier",
            name: "someName",
          },
          property: {
            type: "Literal",
            value: "b",
            loc: {
              source: "'b'",
              start: {
                line: 1,
                column: 21,
              },
              end: {
                line: 1,
                column: 24,
              },
            },
          },
          loc: {
            source: "$(someName{'b'})",
            start: {
              line: 1,
              column: 10,
            },
            end: {
              line: 1,
              column: 26,
            },
          },
        },
        loc: {
          source: "$(someVar{$(someName{'b'})})",
          start: {
            line: 1,
            column: 0,
          },
          end: {
            line: 1,
            column: 28,
          },
        },
      });
    });

    it("HTTP_COOKIE member expression", () => {
      const input = "$(HTTP_COOKIE{'remember_me'})";
      const result = parse(input);

      expect(result).to.have.property("type", "MemberExpression");
      expect(result)
        .to.have.property("object")
        .that.include({
          type: "Identifier",
          name: "HTTP_COOKIE",
        });

      expect(result)
        .to.have.property("property")
        .that.include({
          type: "Literal",
          value: "remember_me",
        });
    });

    it("should handle member expression with array access", () => {
      const input = "$(someVar{1})";
      const result = parse(input);

      expect(result).to.have.property("type", "MemberExpression");
      expect(result)
        .to.have.property("object")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });

      expect(result)
        .to.have.property("property")
        .that.include({
          type: "Literal",
          value: 1,
        });
    });

    it("throws if unclosed member", () => {
      const input = "$(someVar{'a'";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unclosed MemberExpression");
    });

    it("throws if unclosed Identifier", () => {
      const input = "$(someVar{'a'}";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unclosed MemberExpression");
    });

    it("throws if malformated", () => {
      const input = "$(someVar{'a')";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unclosed MemberExpression");
    });
  });

  describe("Literal", () => {
    it("handles number expression", () => {
      const input = "59";
      const result = parse(input);

      expect(result).to.have.property("type", "Literal");
      expect(result)
        .to.have.property("value")
        .that.eql(59);
    });

    it("should return boolean true", () => {
      const input = "true";
      expect(parse(input)).to.include({
        type: "Literal",
        value: true,
      });
    });

    it("should return boolean false", () => {
      const input = "false";
      expect(parse(input)).to.include({
        type: "Literal",
        value: false,
      });
    });

    it("handles string literal expression with @", () => {
      const input = "'jan.bananberg@test.com'";
      const result = parse(input);

      expect(result).to.have.property("type", "Literal");
      expect(result)
        .to.have.property("value")
        .that.eql("jan.bananberg@test.com");
    });

    it("removes backslash in string", () => {
      let result = parse("'\\Program Files\\Game\\Fun.exe.'");
      expect(result).to.include({
        type: "Literal",
        value: "Program FilesGameFun.exe.",
      });

      result = parse("'\\\\/my\\\\stuff/'");
      expect(result).to.include({
        type: "Literal",
        value: "\\/my\\stuff/",
      });
    });

    it("keeps escaped backslash in string", () => {
      const result = parse("'\\\\Program Files\\\\Game\\\\Fun.exe.'");
      expect(result).to.include({
        type: "Literal",
        value: "\\Program Files\\Game\\Fun.exe.",
      });
    });

    it("keeps backslash in escaped string", () => {
      let result = parse("'''\\Program Files\\Game\\Fun.exe.'''");
      expect(result).to.include({
        type: "Literal",
        value: "\\Program Files\\Game\\Fun.exe.",
      });

      result = parse("'''\\/my\\stuff/'''");
      expect(result).to.include({
        type: "Literal",
        value: "\\/my\\stuff/",
      });
    });

    it("almost any random string is ok", () => {
      const input = "'string_split HTTP_USER_AGENT,10)'";
      const result = parse(input);

      expect(result).to.have.property("type", "Literal");
      expect(result).to.include({
        type: "Literal",
        value: "string_split HTTP_USER_AGENT,10)",
      });
    });

    it("throws if unquouted literal expression", () => {
      const input = "jan.bananberg@test.com";

      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unknown keyword");
    });

    it("throws on unexpected keyword", () => {
      expect(() => {
        parse("stick");
      }).to.throw(SyntaxError, "Unknown keyword \"stick\" at \"stick\" 0:0");
    });
  });

  describe("BlockStatement", () => {
    it("happy trail", () => {
      const input = "($(someVar) <= 590)";
      expect(parse(input)).to.deep.equal({
        type: "BlockStatement",
        body: {
          type: "BinaryExpression",
          operator: "<=",
          left: {
            type: "Identifier",
            name: "someVar",
            loc: {
              source: "$(someVar) ",
              start: {
                line: 1,
                column: 1,
              },
              end: {
                line: 1,
                column: 12,
              },
            },
          },
          right: {
            type: "Literal",
            value: 590,
            loc: {
              source: "590",
              start: {
                line: 1,
                column: 15,
              },
              end: {
                line: 1,
                column: 18,
              },
            },
          },
          loc: {
            source: "$(someVar) <= 590",
            start: {
              line: 1,
              column: 1,
            },
            end: {
              line: 1,
              column: 18,
            },
          },
        },
        loc: {
          source: "($(someVar) <= 590)",
          start: {
            line: 1,
            column: 0,
          },
          end: {
            line: 1,
            column: 19,
          },
        },
      });
    });

    it("throws if unclosed", () => {
      const input = "($(someVar) <= 590";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unclosed BlockStatement");
    });
  });

  describe("CallExpression", () => {
    it("happy trail", () => {
      const input = "$substr($(myvar), 1 + 2)";
      expect(parse(input)).to.deep.equal({
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "substr",
        },
        arguments: [ {
          type: "Identifier",
          name: "myvar",
          loc: {
            source: "$(myvar)",
            start: {
              line: 1,
              column: 8,
            },
            end: {
              line: 1,
              column: 16,
            },
          },
        }, {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Literal",
            value: 1,
            loc: {
              source: ", 1 ",
              start: {
                line: 1,
                column: 16,
              },
              end: {
                line: 1,
                column: 20,
              },
            },
          },
          right: {
            type: "Literal",
            value: 2,
            loc: {
              source: "2",
              start: {
                line: 1,
                column: 22,
              },
              end: {
                line: 1,
                column: 23,
              },
            },
          },
          loc: {
            source: ", 1 + 2",
            start: {
              line: 1,
              column: 16,
            },
            end: {
              line: 1,
              column: 23,
            },
          },
        } ],
        loc: {
          source: "$substr($(myvar), 1 + 2)",
          start: {
            line: 1,
            column: 0,
          },
          end: {
            line: 1,
            column: 24,
          },
        },
      });
    });

    it("handles call expression with argument", () => {
      const input = "$exists($(user_email))";
      const result = parse(input);

      expect(result).to.have.property("type", "CallExpression");
      expect(result)
        .to.have.property("callee")
        .that.deep.equal({
          type: "Identifier",
          name: "exists",
        });
      expect(result)
        .to.have.property("arguments")
        .to.deep.equal([ {
          type: "Identifier",
          name: "user_email",
          loc: {
            source: "$(user_email)",
            start: {
              line: 1,
              column: 8,
            },
            end: {
              line: 1,
              column: 21,
            },
          },
        } ]);
    });

    it("handles call expression without argument", () => {
      const input = "$time()";
      const result = parse(input);

      expect(result).to.have.property("type", "CallExpression");
      expect(result)
        .to.have.property("callee")
        .that.include({
          type: "Identifier",
          name: "time",
        });
      expect(result)
        .to.have.property("arguments")
        .to.eql([]);
    });

    it("handles multiple function arguments", () => {
      const input = "$string_split($(HTTP_USER_AGENT), ';', 10)";
      const result = parse(input);

      expect(result).to.have.property("type", "CallExpression");
      expect(result).to.deep.equal({
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "string_split",
        },
        arguments: [
          {
            type: "Identifier",
            name: "HTTP_USER_AGENT",
            loc: {
              source: "$(HTTP_USER_AGENT)",
              start: {
                line: 1,
                column: 14,
              },
              end: {
                line: 1,
                column: 32,
              },
            },
          },
          {
            type: "Literal",
            value: ";",
            loc: {
              source: ", ';'",
              start: {
                line: 1,
                column: 32,
              },
              end: {
                line: 1,
                column: 37,
              },
            },
          },
          {
            type: "Literal",
            value: 10,
            loc: {
              source: ", 10",
              start: {
                line: 1,
                column: 37,
              },
              end: {
                line: 1,
                column: 41,
              },
            },
          },
        ],
        loc: {
          source: "$string_split($(HTTP_USER_AGENT), ';', 10)",
          start: {
            line: 1,
            column: 0,
          },
          end: {
            line: 1,
            column: 42,
          },
        },
      });
    });

    it("handles expression in function call", () => {
      const input = "$digest_md5($(REMOTE_ADDR) + $(HTTP_USER_AGENT))";
      const result = parse(input);

      expect(result).to.have.property("type", "CallExpression");
      expect(result).to.eql({
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "digest_md5",
        },
        arguments: [
          {
            type: "BinaryExpression",
            left: {
              type: "Identifier",
              name: "REMOTE_ADDR",
              loc: {
                source: "$(REMOTE_ADDR) ",
                start: {
                  line: 1,
                  column: 12,
                },
                end: {
                  line: 1,
                  column: 27,
                },
              },
            },
            operator: "+",
            right: {
              type: "Identifier",
              name: "HTTP_USER_AGENT",
              loc: {
                source: "$(HTTP_USER_AGENT)",
                start: {
                  line: 1,
                  column: 29,
                },
                end: {
                  line: 1,
                  column: 47,
                },
              },
            },
            loc: {
              source: "$(REMOTE_ADDR) + $(HTTP_USER_AGENT)",
              start: {
                line: 1,
                column: 12,
              },
              end: {
                line: 1,
                column: 47,
              },
            },
          },
        ],
        loc: {
          source: "$digest_md5($(REMOTE_ADDR) + $(HTTP_USER_AGENT))",
          start: {
            line: 1,
            column: 0,
          },
          end: {
            line: 1,
            column: 48,
          },
        },
      });
    });

    it("throws if unclosed", () => {
      const input = "$substr($(myvar), 1 + 2";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unclosed CallExpression");
    });

    it("throws if missing comma between arguments", () => {
      const input = "$substr($(myvar) 1 + 2)";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unexpected Literal in CallExpression");
    });

    it("throws if initialized with comma", () => {
      const input = "$substr( , $(myvar), 1 + 2)";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unexpected , in CallExpression");
    });
  });

  describe("BinaryExpression", () => {
    it("handle binary expression with identifier on left side and literal on right", () => {
      const input = "$(access_granted)=='true'";
      const result = parse(input);
      expect(result).to.have.property("type", "BinaryExpression");
      expect(result).to.have.property("operator", "==");
      expect(result).to.have.property("left");
      expect(result.left).to.have.property("type", "Identifier");
      expect(result.left).to.have.property("name", "access_granted");
      expect(result).to.have.property("right");
      expect(result.right).to.have.property("type", "Literal");
      expect(result.right).to.have.property("value", "true");
    });

    it("handle binary negative expression with identifier on left side and literal on right", () => {
      const input = "$(access_granted)!='true'";
      const result = parse(input);
      expect(result).to.have.property("type", "BinaryExpression");
      expect(result).to.have.property("operator", "!=");
      expect(result).to.have.property("left");
      expect(result.left).to.have.property("type", "Identifier");
      expect(result.left).to.have.property("name", "access_granted");
      expect(result).to.have.property("right");
      expect(result.right).to.have.property("type", "Literal");
      expect(result.right).to.have.property("value", "true");
    });

    it("handles binary expression with number literal", () => {
      const input = "$(someVar) == 59";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });
      expect(result)
        .to.have.property("operator")
        .that.equal("==");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 59,
        });
    });

    it("handles binary expression with negative number literal", () => {
      const input = "$(someVar) == -1";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });
      expect(result)
        .to.have.property("operator")
        .that.equal("==");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: -1,
        });
    });

    it("handles binary expression with >= operator", () => {
      const input = "$(someVar) >= 59";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });
      expect(result)
        .to.have.property("operator")
        .that.equal(">=");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 59,
        });
    });

    it("handles binary expression with <= operator", () => {
      const input = "$(someVar) <= 590";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });
      expect(result)
        .to.have.property("operator")
        .that.equal("<=");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 590,
        });
    });

    it("handles binary expression with < operator", () => {
      const input = "$(someVar) < 590";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });
      expect(result)
        .to.have.property("operator")
        .that.equal("<");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 590,
        });
    });

    it("handles binary expression with > operator", () => {
      const input = "$(someVar) > 590";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });
      expect(result)
        .to.have.property("operator")
        .that.equal(">");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 590,
        });
    });

    it("handles binary expression enclosed in unnecessary parentheses", () => {
      const input = "($(someVar) <= 590)";
      const result = parse(input);

      expect(result).to.have.property("type", "BlockStatement");

      expect(result.body).to.have.property("type", "BinaryExpression");
      expect(result.body)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });
      expect(result.body)
        .to.have.property("operator")
        .that.eql("<=");
      expect(result.body)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 590,
        });
    });

    it("handles binary expression where each expression is enclosed in unnecessary parentheses", () => {
      const input = "($(someVar)) <= (590)";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");

      expect(result.left).to.have.property("type", "BlockStatement");
      expect(result.left)
        .to.have.property("body")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });
      expect(result.right).to.have.property("type", "BlockStatement");
      expect(result.right)
        .to.have.property("body")
        .that.include({
          type: "Literal",
          value: 590,
        });
    });

    it("handles string binary expression with +", () => {
      const input = "'1' + '2'";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Literal",
          value: "1",
        });
      expect(result)
        .to.have.property("operator")
        .that.eql("+");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: "2",
        });
    });

    it("handles variables named 'has' (although it's used in binary expressions)", () => {
      const input = "$(has) == 'true'";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "has",
        });
      expect(result)
        .to.have.property("operator")
        .that.eql("==");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: "true",
        });
    });

    it("handles variables named 'has' and 'has_i' (although they are used in binary expressions)", () => {
      const input = "$(has_i) == $(has)";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "has_i",
        });
      expect(result)
        .to.have.property("operator")
        .that.eql("==");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Identifier",
          name: "has",
        });
    });

    it("handles arithmetic binary expression with +", () => {
      const input = "1 + 2";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Literal",
          value: 1,
        });
      expect(result)
        .to.have.property("operator")
        .that.eql("+");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 2,
        });
    });

    it("handles arithmetic binary expression with -", () => {
      const input = "1 - 2";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Literal",
          value: 1,
        });
      expect(result)
        .to.have.property("operator")
        .that.eql("-");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 2,
        });
    });

    it("handles arithmetic binary expression with *", () => {
      const input = "1 * 2";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Literal",
          value: 1,
        });
      expect(result)
        .to.have.property("operator")
        .that.eql("*");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 2,
        });
    });

    it("handles arithmetic binary expression with /", () => {
      const input = "1 / 2";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Literal",
          value: 1,
        });
      expect(result)
        .to.have.property("operator")
        .that.eql("/");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 2,
        });
    });

    it("handles arithmetic binary expression with %", () => {
      const input = "1 % 2";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Literal",
          value: 1,
        });
      expect(result)
        .to.have.property("operator")
        .that.eql("%");
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 2,
        });
    });

    it("gives higher precedence to + expressions than ==", () => {
      const input = "1 + 2 == 3";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("operator")
        .that.eql("==");
      expect(result)
        .to.have.property("left")
        .that.deep.equal({
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Literal",
            value: 1,
            loc: {
              source: "1 ",
              start: { line: 1, column: 0 },
              end: { line: 1, column: 2 },
            },
          },
          right: {
            type: "Literal",
            value: 2,
            loc: {
              source: "2 ",
              start: { line: 1, column: 4 },
              end: { line: 1, column: 6 },
            },
          },
          loc: {
            source: "1 + 2 ",
            start: { line: 1, column: 0 },
            end: { line: 1, column: 6 },
          },
        });

      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 3,
        });
    });

    it("gives higher precedence to - expressions than ==", () => {
      const input = "1 - 2 == 3";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("operator")
        .that.eql("==");
      expect(result)
        .to.have.property("left")
        .that.deep.equal({
          type: "BinaryExpression",
          operator: "-",
          left: {
            type: "Literal",
            value: 1,
            loc: {
              source: "1 ",
              start: { line: 1, column: 0 },
              end: { line: 1, column: 2 },
            },
          },
          right: {
            type: "Literal",
            value: 2,
            loc: {
              source: "2 ",
              start: { line: 1, column: 4 },
              end: { line: 1, column: 6 },
            },
          },
          loc: {
            source: "1 - 2 ",
            start: { line: 1, column: 0 },
            end: { line: 1, column: 6 },
          },
        });

      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 3,
        });
    });

    it("gives higher precedence to * expressions than ==", () => {
      const input = "1 * 2 == 3";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("operator")
        .that.eql("==");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "BinaryExpression",
          operator: "*",
        });

      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 3,
        });
    });

    it("gives higher precedence to / expressions than ==", () => {
      const input = "1 / 2 == 3";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("operator")
        .that.eql("==");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "BinaryExpression",
          operator: "/",
        });

      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 3,
        });
    });

    it("gives higher precedence to % expressions than ==", () => {
      const input = "1 % 2 == 3";
      const result = parse(input);

      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("operator")
        .that.eql("==");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "BinaryExpression",
          operator: "%",
        });

      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: 3,
        });
    });

    it("handles binary expression where one expression is a regular expression", () => {
      const input = "$(HTTP_REFERER) matches '''(google|yahoo|bing|yandex)\\.\\d+$'''";
      const result = parse(input);

      expect(result).to.deep.equal({
        type: "BinaryExpression",
        operator: "matches",
        left: {
          type: "Identifier",
          name: "HTTP_REFERER",
          loc: {
            source: "$(HTTP_REFERER) ",
            start: { line: 1, column: 0 },
            end: { line: 1, column: 16 },
          },
        },
        right: {
          type: "Literal",
          value: "(google|yahoo|bing|yandex)\\.\\d+$",
          loc: {
            source: "'''(google|yahoo|bing|yandex)\\.\\d+$'''",
            start: { line: 1, column: 24 },
            end: { line: 1, column: 62 },
          },
        },
        loc: {
          source: "$(HTTP_REFERER) matches '''(google|yahoo|bing|yandex)\\.\\d+$'''",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 62 },
        },
      });
    });

    it("handles triple quoute enclosed string", () => {
      const input = "$(someVar) == '''my\\value'''";
      const result = parse(input);
      expect(result).to.have.property("type", "BinaryExpression");
      expect(result)
        .to.have.property("left")
        .that.include({
          type: "Identifier",
          name: "someVar",
        });
      expect(result)
        .to.have.property("right")
        .that.include({
          type: "Literal",
          value: "my\\value",
        });
    });

    it("throws unexpected token if unclosed binary", () => {
      expect(() => {
        parse("$(someVar)==");
      }).to.throw(SyntaxError, "Unexpected token \"==\" at \"$(someVar)==\" 0:10");
    });

    it("throws unexpected token if starting with operator", () => {
      expect(() => {
        parse("   == $(someVar)");
      }).to.throw(SyntaxError, "Unexpected token \"==\" at \"== $(someVar)\" 0:0");
    });
  });

  describe("LogicalExpression", () => {
    it("handle logical expression with & operator ", () => {
      const input = "$(HTTP_USER_AGENT{'os'})=='WIN' & $(HTTP_USER_AGENT{'browser'})=='MSIE'";
      const result = parse(input);

      expect(result).to.deep.equal({
        type: "LogicalExpression",
        operator: "&",
        left: {
          type: "BinaryExpression",
          operator: "==",
          left: {
            type: "MemberExpression",
            object: {
              type: "Identifier",
              name: "HTTP_USER_AGENT",
            },
            property: {
              type: "Literal",
              value: "os",
              loc: {
                source: "'os'",
                start: { line: 1, column: 18 },
                end: { line: 1, column: 22 },
              },
            },
            loc: {
              source: "$(HTTP_USER_AGENT{'os'})",
              start: { line: 1, column: 0 },
              end: { line: 1, column: 24 },
            },
          },
          right: {
            type: "Literal",
            value: "WIN",
            loc: {
              source: "'WIN' ",
              start: { line: 1, column: 26 },
              end: { line: 1, column: 32 },
            },
          },
          loc: {
            source: "$(HTTP_USER_AGENT{'os'})=='WIN' ",
            start: { line: 1, column: 0 },
            end: { line: 1, column: 32 },
          },
        },
        right: {
          type: "BinaryExpression",
          operator: "==",
          left: {
            type: "MemberExpression",
            object: {
              type: "Identifier",
              name: "HTTP_USER_AGENT",
            },
            property: {
              type: "Literal",
              value: "browser",
              loc: {
                source: "'browser'",
                start: { line: 1, column: 52 },
                end: { line: 1, column: 61 },
              },
            },
            loc: {
              source: "$(HTTP_USER_AGENT{'browser'})",
              start: { line: 1, column: 34 },
              end: { line: 1, column: 63 },
            },
          },
          right: {
            type: "Literal",
            value: "MSIE",
            loc: {
              source: "'MSIE'",
              start: { line: 1, column: 65 },
              end: { line: 1, column: 71 },
            },
          },
          loc: {
            source: "$(HTTP_USER_AGENT{'browser'})=='MSIE'",
            start: { line: 1, column: 34 },
            end: { line: 1, column: 71 },
          },
        },
        loc: {
          source: "$(HTTP_USER_AGENT{'os'})=='WIN' & $(HTTP_USER_AGENT{'browser'})=='MSIE'",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 71 },
        },
      });
    });

    it("handles logical expression where left and right are enclosed in unnecessary parentheses", () => {
      const input = "($(someVar) == 1) && (2 == $(someOtherVar))";
      const result = parse(input);

      expect(result).to.deep.equal({
        type: "LogicalExpression",
        operator: "&&",
        left: {
          type: "BlockStatement",
          body: {
            type: "BinaryExpression",
            operator: "==",
            left: {
              type: "Identifier",
              name: "someVar",
              loc: {
                source: "$(someVar) ",
                start: {
                  line: 1,
                  column: 1,
                },
                end: {
                  line: 1,
                  column: 12,
                },
              },
            },
            right: {
              type: "Literal",
              value: 1,
              loc: {
                source: "1",
                start: {
                  line: 1,
                  column: 15,
                },
                end: {
                  line: 1,
                  column: 16,
                },
              },
            },
            loc: {
              source: "$(someVar) == 1",
              start: {
                line: 1,
                column: 1,
              },
              end: {
                line: 1,
                column: 16,
              },
            },
          },
          loc: {
            source: "($(someVar) == 1) ",
            start: {
              line: 1,
              column: 0,
            },
            end: {
              line: 1,
              column: 18,
            },
          },
        },
        right: {
          type: "BlockStatement",
          body: {
            type: "BinaryExpression",
            operator: "==",
            left: {
              type: "Literal",
              value: 2,
              loc: {
                source: "2 ",
                start: {
                  line: 1,
                  column: 22,
                },
                end: {
                  line: 1,
                  column: 24,
                },
              },
            },
            right: {
              type: "Identifier",
              name: "someOtherVar",
              loc: {
                source: "$(someOtherVar)",
                start: {
                  line: 1,
                  column: 27,
                },
                end: {
                  line: 1,
                  column: 42,
                },
              },
            },
            loc: {
              source: "2 == $(someOtherVar)",
              start: {
                line: 1,
                column: 22,
              },
              end: {
                line: 1,
                column: 42,
              },
            },
          },
          loc: {
            source: "(2 == $(someOtherVar))",
            start: {
              line: 1,
              column: 21,
            },
            end: {
              line: 1,
              column: 43,
            },
          },
        },
        loc: {
          source: "($(someVar) == 1) && (2 == $(someOtherVar))",
          start: {
            line: 1,
            column: 0,
          },
          end: {
            line: 1,
            column: 43,
          },
        },
      });
    });

    it("should handle logical expression with call expressions", () => {
      const input = "$exists($(HTTP_COOKIE{'remember_me'})) | $exists($(HTTP_COOKIE{'accessToken'}))";
      const result = parse(input);

      expect(result).to.deep.equal({
        type: "LogicalExpression",
        operator: "|",
        left: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: "exists",
          },
          arguments: [ {
            type: "MemberExpression",
            object: {
              type: "Identifier",
              name: "HTTP_COOKIE",
            },
            property: {
              type: "Literal",
              value: "remember_me",
              loc: {
                source: "'remember_me'",
                start: { line: 1, column: 22 },
                end: { line: 1, column: 35 },
              },
            },
            loc: {
              source: "$(HTTP_COOKIE{'remember_me'})",
              start: { line: 1, column: 8 },
              end: { line: 1, column: 37 },
            },
          } ],
          loc: {
            source: "$exists($(HTTP_COOKIE{'remember_me'})) ",
            start: { line: 1, column: 0 },
            end: { line: 1, column: 39 },
          },
        },
        right: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: "exists",
          },
          arguments: [ {
            type: "MemberExpression",
            object: {
              type: "Identifier",
              name: "HTTP_COOKIE",
            },
            property: {
              type: "Literal",
              value: "accessToken",
              loc: {
                source: "'accessToken'",
                start: { line: 1, column: 63 },
                end: { line: 1, column: 76 },
              },
            },
            loc: {
              source: "$(HTTP_COOKIE{'accessToken'})",
              start: { line: 1, column: 49 },
              end: { line: 1, column: 78 },
            },
          } ],
          loc: {
            source: "$exists($(HTTP_COOKIE{'accessToken'}))",
            start: { line: 1, column: 41 },
            end: { line: 1, column: 79 },
          },
        },
        loc: {
          source: "$exists($(HTTP_COOKIE{'remember_me'})) | $exists($(HTTP_COOKIE{'accessToken'}))",
          start: {
            line: 1,
            column: 0,
          },
          end: {
            line: 1,
            column: 79,
          },
        },
      });
    });

    it("handle logical expression where left is a unary expression", () => {
      const input = "!$exists($(HTTP_COOKIE{'remember_me'})) | $exists($(HTTP_COOKIE{'accessToken'}))";
      const result = parse(input);
      expect(result).to.deep.equal({
        type: "LogicalExpression",
        operator: "|",
        left: {
          type: "UnaryExpression",
          operator: "!",
          prefix: true,
          argument: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "exists",
            },
            arguments: [ {
              type: "MemberExpression",
              object: {
                type: "Identifier",
                name: "HTTP_COOKIE",
              },
              property: {
                type: "Literal",
                value: "remember_me",
                loc: {
                  source: "'remember_me'",
                  start: { line: 1, column: 23 },
                  end: { line: 1, column: 36 },
                },
              },
              loc: {
                source: "$(HTTP_COOKIE{'remember_me'})",
                start: { line: 1, column: 9 },
                end: { line: 1, column: 38 },
              },
            } ],
            loc: {
              source: "$exists($(HTTP_COOKIE{'remember_me'})) ",
              start: { line: 1, column: 1 },
              end: { line: 1, column: 40 },
            },
          },
          loc: {
            source: "!$exists($(HTTP_COOKIE{'remember_me'})) ",
            start: { line: 1, column: 0 },
            end: { line: 1, column: 40 },
          },
        },
        right: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: "exists",
          },
          arguments: [ {
            type: "MemberExpression",
            object: {
              type: "Identifier",
              name: "HTTP_COOKIE",
            },
            property: {
              type: "Literal",
              value: "accessToken",
              loc: {
                source: "'accessToken'",
                start: { line: 1, column: 64 },
                end: { line: 1, column: 77 },
              },
            },
            loc: {
              source: "$(HTTP_COOKIE{'accessToken'})",
              start: { line: 1, column: 50 },
              end: { line: 1, column: 79 },
            },
          } ],
          loc: {
            source: "$exists($(HTTP_COOKIE{'accessToken'}))",
            start: { line: 1, column: 42 },
            end: { line: 1, column: 80 },
          },
        },
        loc: {
          source: "!$exists($(HTTP_COOKIE{'remember_me'})) | $exists($(HTTP_COOKIE{'accessToken'}))",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 80 },
        },
      });
    });

    it("handle multiple ors", () => {
      const input = "$exists($(HTTP_COOKIE{'remember_me'})) | $exists($(HTTP_COOKIE{'accessToken'})) | $exists($(HTTP_COOKIE{'sessionKey'}))";
      const result = parse(input);
      expect(result).to.deep.equal({
        type: "LogicalExpression",
        operator: "|",
        left: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: "exists",
          },
          arguments: [ {
            type: "MemberExpression",
            object: {
              type: "Identifier",
              name: "HTTP_COOKIE",
            },
            property: {
              type: "Literal",
              value: "remember_me",
              loc: {
                source: "'remember_me'",
                start: { line: 1, column: 22 },
                end: { line: 1, column: 35 },
              },
            },
            loc: {
              source: "$(HTTP_COOKIE{'remember_me'})",
              start: { line: 1, column: 8 },
              end: { line: 1, column: 37 },
            },
          } ],
          loc: {
            source: "$exists($(HTTP_COOKIE{'remember_me'})) ",
            start: { line: 1, column: 0 },
            end: { line: 1, column: 39 },
          },
        },
        right: {
          type: "LogicalExpression",
          operator: "|",
          left: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "exists",
            },
            arguments: [ {
              type: "MemberExpression",
              object: {
                type: "Identifier",
                name: "HTTP_COOKIE",
              },
              property: {
                type: "Literal",
                value: "accessToken",
                loc: {
                  source: "'accessToken'",
                  start: { line: 1, column: 63 },
                  end: { line: 1, column: 76 },
                },
              },
              loc: {
                source: "$(HTTP_COOKIE{'accessToken'})",
                start: { line: 1, column: 49 },
                end: { line: 1, column: 78 },
              },
            } ],
            loc: {
              source: "$exists($(HTTP_COOKIE{'accessToken'})) ",
              start: { line: 1, column: 41 },
              end: { line: 1, column: 80 },
            },
          },
          right: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "exists",
            },
            arguments: [ {
              type: "MemberExpression",
              object: {
                type: "Identifier",
                name: "HTTP_COOKIE",
              },
              property: {
                type: "Literal",
                value: "sessionKey",
                loc: {
                  source: "'sessionKey'",
                  start: { line: 1, column: 104 },
                  end: { line: 1, column: 116 },
                },
              },
              loc: {
                source: "$(HTTP_COOKIE{'sessionKey'})",
                start: { line: 1, column: 90 },
                end: { line: 1, column: 118 },
              },
            } ],
            loc: {
              source: "$exists($(HTTP_COOKIE{'sessionKey'}))",
              start: { line: 1, column: 82 },
              end: { line: 1, column: 119 },
            },
          },
          loc: {
            source: "$exists($(HTTP_COOKIE{'accessToken'})) | $exists($(HTTP_COOKIE{'sessionKey'}))",
            start: { line: 1, column: 41 },
            end: { line: 1, column: 119 },
          },
        },
        loc: {
          source: "$exists($(HTTP_COOKIE{'remember_me'})) | $exists($(HTTP_COOKIE{'accessToken'})) | $exists($(HTTP_COOKIE{'sessionKey'}))",
          start: { column: 0, line: 1 },
          end: { column: 119, line: 1 },
        },
      });
    });

    it("handles multiple evaluations with two regular expressions", () => {
      const input = "$(HTTP_REFERER) matches '''(google|yahoo|bing|yandex)\\.\\d+$''' && 'newyork' matches 'newyorknewyork'";
      const result = parse(input);

      expect(result).to.have.property("type", "LogicalExpression");
      expect(result).to.have.property("operator", "&&");
      expect(result).to.have.property("left").with.property("type", "BinaryExpression");
      expect(result.left).to.have.property("operator", "matches");
      expect(result.left).to.have.property("left").with.that.include({
        type: "Identifier",
        name: "HTTP_REFERER",
      });
      expect(result.left).to.have.property("right").with.that.include({
        type: "Literal",
        value: "(google|yahoo|bing|yandex)\\.\\d+$",
      });

      expect(result).to.have.property("right").with.property("type", "BinaryExpression");
      expect(result.right).to.have.property("operator", "matches");
      expect(result.right).to.have.property("left").with.that.include({
        type: "Literal",
        value: "newyork",
      });
      expect(result.right).to.have.property("right").with.that.include({
        type: "Literal",
        value: "newyorknewyork",
      });
    });

    it("handles logical expression with && operator", () => {
      const input = "$(someVar) == 'a' && $(someVar2) == 'b'";
      const result = parse(input);

      expect(result).to.have.property("type", "LogicalExpression");
      expect(result).to.have.property("operator", "&&");
      expect(result).to.have.property("left").with.property("type", "BinaryExpression");
      expect(result.left).to.have.property("operator", "==");
      expect(result.left).to.have.property("left").with.that.include({
        type: "Identifier",
        name: "someVar",
      });
      expect(result.left).to.have.property("right").with.that.include({
        type: "Literal",
        value: "a",
      });

      expect(result).to.have.property("right").with.property("type", "BinaryExpression");
      expect(result.right).to.have.property("operator", "==");
      expect(result.right).to.have.property("left").with.that.include({
        type: "Identifier",
        name: "someVar2",
      });
      expect(result.right).to.have.property("right").with.that.include({
        type: "Literal",
        value: "b",
      });
    });

    it("throws unexpected token if unclosed logical", () => {
      expect(() => {
        parse("$(someVar) |   ");
      }).to.throw(SyntaxError, "Unexpected token \"|\" at \"$(someVar) |\" 0:11");
    });

    it("throws unexpected token if starting with operator", () => {
      expect(() => {
        parse("| $(someVar)");
      }).to.throw(SyntaxError, "Unexpected token \"|\" at \"| $(someVar)\" 0:0");
    });
  });

  describe("UnaryExpression", () => {
    it("takes BlockStatement", () => {
      const input = "!(1==2)";
      expect(parse(input)).to.deep.include({
        type: "UnaryExpression",
        operator: "!",
        argument: {
          type: "BlockStatement",
          body: {
            type: "BinaryExpression",
            operator: "==",
            left: {
              type: "Literal",
              value: 1,
              loc: {
                source: "1",
                start: { line: 1, column: 2 },
                end: { line: 1, column: 3 },
              },
            },
            right: {
              type: "Literal",
              value: 2,
              loc: {
                source: "2",
                start: { line: 1, column: 5 },
                end: { line: 1, column: 6 },
              },
            },
            loc: {
              source: "1==2",
              start: { line: 1, column: 2 },
              end: { line: 1, column: 6 },
            },
          },
          loc: {
            source: "(1==2)",
            start: { line: 1, column: 1 },
            end: { line: 1, column: 7 },
          },
        },
        loc: {
          source: "!(1==2)",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 7 },
        },
      });
    });

    it("takes CallExpression", () => {
      const input = "!$exists($(HTTP_COOKIE{'remember_me'}))";
      const result = parse(input);

      expect(result).to.have.property("type", "UnaryExpression");
      expect(result).to.have.property("operator", "!");
      expect(result).to.have.property("prefix", true);

      expect(result).to.have.property("argument").with.property("type", "CallExpression");
      expect(result.argument).to.have.property("callee").with.property("name", "exists");
      expect(result.argument).to.have.property("arguments").with.length(1);
      expect(result.argument.arguments[0]).to.deep.include({
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "HTTP_COOKIE",
        },
      });
      expect(result.argument.arguments[0].property).to.deep.include({
        type: "Literal",
        value: "remember_me",
      });
    });

    it("throws unexpected token if just exclamation mark", () => {
      expect(() => {
        parse("!");
      }).to.throw(SyntaxError, "Unexpected token \"!\" at \"!\" 0:1");
    });
  });

  describe("ObjectExpression", () => {
    it("happy trail", () => {
      const input = "{'a': 1, 'b': 2}";
      const object = parse(input);
      expect(object).to.deep.equal({
        type: "ObjectExpression",
        properties: [ {
          type: "Property",
          key: {
            type: "Identifier",
            name: "a",
          },
          value: {
            type: "Literal",
            value: 1,
            loc: {
              source: "1",
              start: { line: 1, column: 6 },
              end: { line: 1, column: 7 },
            },
          },
          loc: {
            source: "'a': 1",
            start: { line: 1, column: 1 },
            end: { line: 1, column: 7 },
          },
        }, {
          type: "Property",
          key: {
            type: "Identifier",
            name: "b",
          },
          value: {
            type: "Literal",
            value: 2,
            loc: {
              source: "2",
              start: { line: 1, column: 14 },
              end: { line: 1, column: 15 },
            },
          },
          loc: {
            source: ", 'b': 2",
            start: { line: 1, column: 7 },
            end: { line: 1, column: 15 },
          },
        } ],
        loc: {
          source: input,
          start: { line: 1, column: 0 },
          end: { line: 1, column: 16 },
        },
      });
    });

    it("empty object", () => {
      const input = "{}";
      const object = parse(input);
      expect(object).to.deep.include({
        type: "ObjectExpression",
        properties: [],
      });
    });

    it("value with BlockStatement", () => {
      const input = "{'a': 1, 0: 2, 'c': (1 < 2)}";
      const object = parse(input);
      expect(object).to.have.property("type", "ObjectExpression");
      expect(object).to.have.property("properties").with.length(3);
      expect(object.properties[2]).deep.equal({
        type: "Property",
        key: {
          type: "Identifier",
          name: "c",
        },
        value: {
          type: "BlockStatement",
          body: {
            type: "BinaryExpression",
            operator: "<",
            left: {
              type: "Literal",
              value: 1,
              loc: {
                source: "1 ",
                start: { line: 1, column: 21 },
                end: { line: 1, column: 23 },
              },
            },
            right: {
              type: "Literal",
              value: 2,
              loc: {
                source: "2",
                start: { line: 1, column: 25 },
                end: { line: 1, column: 26 },
              },
            },
            loc: {
              source: "1 < 2",
              start: { line: 1, column: 21 },
              end: { line: 1, column: 26 },
            },
          },
          loc: {
            source: "(1 < 2)",
            start: { line: 1, column: 20 },
            end: { line: 1, column: 27 },
          },
        },
        loc: {
          source: ", 'c': (1 < 2)",
          start: { line: 1, column: 13 },
          end: { line: 1, column: 27 },
        },
      });
    });

    it("throws if unclosed", () => {
      const input = "{'a': 1, 'b': 2";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unclosed ObjectExpression");
    });

    it("throws if key is not literal", () => {
      const input = "{$(key): 1, 'b' 2}";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unexpected key");
    });

    it("throws if missing colon between key and value", () => {
      const input = "{'a': 1, 'b' 2}";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unexpected Literal in object");
    });
  });

  describe("ArrayExpression", () => {
    it("happy trail", () => {
      const input = "[1, 2, 3]";
      const object = parse(input);
      expect(object).to.deep.equal({
        type: "ArrayExpression",
        elements: [ {
          type: "Literal",
          value: 1,
          loc: {
            source: "1",
            start: { line: 1, column: 1 },
            end: { line: 1, column: 2 },
          },
        }, {
          type: "Literal",
          value: 2,
          loc: {
            source: ", 2",
            start: { line: 1, column: 2 },
            end: { line: 1, column: 5 },
          },
        }, {
          type: "Literal",
          value: 3,
          loc: {
            source: ", 3",
            start: { line: 1, column: 5 },
            end: { line: 1, column: 8 },
          },
        } ],
        loc: {
          source: input,
          start: { line: 1, column: 0 },
          end: { line: 1, column: 9 },
        },
      });
    });

    it("empty array", () => {
      const input = "[]";
      const object = parse(input);
      expect(object).to.deep.include({
        type: "ArrayExpression",
        elements: [],
      });
    });

    it("element as BlockStatement", () => {
      const input = "['a', 0, (1 < 2)]";
      const object = parse(input);
      expect(object).to.have.property("type", "ArrayExpression");
      expect(object).to.have.property("elements").with.length(3);
      expect(object.elements[2]).deep.equal({
        type: "BlockStatement",
        body: {
          type: "BinaryExpression",
          operator: "<",
          left: {
            type: "Literal",
            value: 1,
            loc: {
              source: "1 ",
              start: { line: 1, column: 10 },
              end: { line: 1, column: 12 },
            },
          },
          right: {
            type: "Literal",
            value: 2,
            loc: {
              source: "2",
              start: { line: 1, column: 14 },
              end: { line: 1, column: 15 },
            },
          },
          loc: {
            source: "1 < 2",
            start: { line: 1, column: 10 },
            end: { line: 1, column: 15 },
          },
        },
        loc: {
          source: ", (1 < 2)",
          start: { line: 1, column: 7 },
          end: { line: 1, column: 16 },
        },
      });
    });

    it("with identifier elements", () => {
      const result = parse("[$(someVar1), $(someVar2)]");

      expect(result).to.have.property("type", "ArrayExpression");
      expect(result).to.have.property("elements").with.length(2);
      expect(result.elements[0]).to.deep.include({
        type: "Identifier",
        name: "someVar1",
      });
      expect(result.elements[1]).to.deep.include({
        type: "Identifier",
        name: "someVar2",
      });
    });

    it("throws if unclosed", () => {
      const input = "[1, 2, 3";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unclosed ArrayExpression");
    });

    it("throws if missing comma between elements", () => {
      const input = "[1, 2 3]";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unexpected Literal in ArrayExpression");
    });

    it("throws if initialized with comma", () => {
      const input = "[ , 2 3]";
      expect(() => {
        parse(input);
      }).to.throw(SyntaxError, "Unexpected , in ArrayExpression");
    });
  });

  describe("CallExpression", () => {
    it("accepts binary expression", () => {
      const input = "$int(1+4)";
      const result = parse(input);
      expect(result).to.have.property("type", "CallExpression");
      expect(result).to.have.property("arguments").that.have.length(1);
      expect(result.arguments[0]).to.deep.include({
        type: "BinaryExpression",
        operator: "+",
      });
      expect(result.arguments[0]).to.have.property("left").that.deep.include({
        type: "Literal",
        value: 1,
      });
      expect(result.arguments[0]).to.have.property("right").that.deep.include({
        type: "Literal",
        value: 4,
      });
    });

    it("accepts complex argument", () => {
      const input = "$int($str(1) + $str(4))";
      const result = parse(input);
      expect(result).to.have.property("type", "CallExpression");
      expect(result).to.have.property("arguments").with.length(1);

      expect(result.arguments[0]).to.deep.include({
        type: "BinaryExpression",
        operator: "+",
      });
      expect(result.arguments[0]).to.have.property("left").that.deep.include({ type: "CallExpression" });
      expect(result.arguments[0]).to.have.property("right").that.deep.include({ type: "CallExpression" });
    });
  });

  describe("split text into and expressions and plain text", () => {
    it("extracts identifier from text", () => {
      const text = "some text surrounding $(var) and beyond";
      const result = split(text);

      expect(result).to.eql([ {
        type: "TEXT",
        text: "some text surrounding ",
      }, {
        expression: {
          type: "Identifier",
          name: "var",
          loc: {
            source: "$(var) ",
            start: { line: 1, column: 22 },
            end: { line: 1, column: 29 },
          },
        },
      }, {
        type: "TEXT",
        text: " and beyond",
      } ]);
    });

    it("extracts identifiers from text", () => {
      const text = "some text surrounding $(var1) and before $(var2)";
      const result = split(text);
      expect(result).to.eql([
        {
          type: "TEXT",
          text: "some text surrounding ",
        },
        {
          expression: {
            type: "Identifier",
            name: "var1",
            loc: {
              source: "$(var1) ",
              start: { line: 1, column: 22 },
              end: { line: 1, column: 30 },
            },
          },
        },
        {
          type: "TEXT",
          text: " and before ",
        },
        {
          expression: {
            type: "Identifier",
            name: "var2",
            loc: {
              source: "$(var2)",
              start: { line: 1, column: 41 },
              end: { line: 1, column: 48 },
            },
          },
        },
      ]);
    });

    it("extracts call expression with one argument from text", () => {
      const text = "\n$set_response_code( 401 ) \n";
      const result = split(text);
      expect(result).to.deep.equal([
        {
          type: "TEXT",
          text: "\n",
        },
        {
          expression: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "set_response_code",
            },
            arguments: [
              {
                type: "Literal",
                value: 401,
                loc: {
                  source: "401 ",
                  start: { line: 2, column: 20 },
                  end: { line: 2, column: 24 },
                },
              },
            ],
            loc: {
              source: "$set_response_code( 401 ) ",
              start: { line: 2, column: 0 },
              end: { line: 2, column: 26 },
            },
          },
        },
        {
          type: "TEXT",
          text: " \n",
        },
      ]);
    });

    it("extracts call expression with one argument from text", () => {
      const text = "/mystuff/?a=b&user=$url_encode($(user_email))";
      const result = split(text);
      expect(result).to.deep.equal([
        {
          type: "TEXT",
          text: "/mystuff/?a=b&user=",
        },
        {
          expression: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "url_encode",
            },
            arguments: [
              {
                type: "Identifier",
                name: "user_email",
                loc: {
                  source: "$(user_email)",
                  start: { line: 1, column: 31 },
                  end: { line: 1, column: 44 },
                },
              },
            ],
            loc: {
              source: "$url_encode($(user_email))",
              start: { line: 1, column: 19 },
              end: { line: 1, column: 45 },
            },
          },
        },
      ]);
    });

    it("extracts call expression with two arguments from text", () => {
      const text = "\n$add_header('Set-Cookie', 'MyCookie1=SomeValue; HttpOnly')\n";
      const result = split(text);
      expect(result[0]).to.deep.equal({ type: "TEXT", text: "\n" });
      expect(result[1]).to.eql({
        expression: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: "add_header",
          },
          arguments: [ {
            type: "Literal",
            value: "Set-Cookie",
            loc: {
              source: "'Set-Cookie'",
              start: { line: 2, column: 12 },
              end: { line: 2, column: 24 },
            },
          },
          {
            type: "Literal",
            value: "MyCookie1=SomeValue; HttpOnly",
            loc: {
              source: ", 'MyCookie1=SomeValue; HttpOnly'",
              start: { line: 2, column: 24 },
              end: { line: 2, column: 57 },
            },
          } ],
          loc: {
            source: "$add_header('Set-Cookie', 'MyCookie1=SomeValue; HttpOnly')",
            start: { line: 2, column: 0 },
            end: { line: 2, column: 58 },
          },
        },
      });
      expect(result.length).to.equal(3);
    });

    it("extracts member expressions", () => {
      const text = "/mystuff/?a=$(QUERY_STRING{'b'})&user=$(QUERY_STRING{'user'})";
      const result = split(text);
      expect(result[1]).to.have.property("expression").that.deep.equal({
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "QUERY_STRING",
        },
        property: {
          type: "Literal",
          value: "b",
          loc: {
            source: "'b'",
            start: { line: 1, column: 27 },
            end: { line: 1, column: 30 },
          },
        },
        loc: {
          source: "$(QUERY_STRING{'b'})",
          start: { line: 1, column: 12 },
          end: { line: 1, column: 32 },
        },
      });
      expect(result[3]).to.have.property("expression").that.deep.equal({
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "QUERY_STRING",
        },
        property: {
          type: "Literal",
          value: "user",
          loc: {
            source: "'user'",
            start: { line: 1, column: 53 },
            end: { line: 1, column: 59 },
          },
        },
        loc: {
          source: "$(QUERY_STRING{'user'})",
          start: { line: 1, column: 38 },
          end: { line: 1, column: 61 },
        },
      });
      expect(result.length).to.equal(4);
    });

    it("extracts concatenated expressions", () => {
      const text = "Welcome $(QUERY_STRING{'b'})$(QUERY_STRING{'user'})";
      const result = split(text);
      expect(result[0]).to.deep.equal({
        type: "TEXT",
        text: "Welcome ",
      });
      expect(result[1]).to.have.property("expression").that.deep.include({ type: "MemberExpression" });
      expect(result[1]).to.have.property("expression").that.deep.include({ type: "MemberExpression" });
      expect(result.length).to.equal(3);
    });

    it("works with pretext and new lines", () => {
      const input = "a: $int(1+1),\n b: $int(1+2),\n c: $int(1+3)";
      const hits = split(input);
      expect(hits[0]).to.deep.equal({ type: "TEXT", text: "a: " });

      expect(hits[1]).to.have.property("expression").that.deep.equal({
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "int",
        },
        arguments: [ {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Literal",
            value: 1,
            loc: {
              source: "1",
              start: { line: 1, column: 8 },
              end: { line: 1, column: 9 },
            },
          },
          right: {
            type: "Literal",
            value: 1,
            loc: {
              source: "1",
              start: { line: 1, column: 10 },
              end: { line: 1, column: 11 },
            },
          },
          loc: {
            source: "1+1",
            start: { line: 1, column: 8 },
            end: { line: 1, column: 11 },
          },
        } ],
        loc: {
          source: "$int(1+1)",
          start: { line: 1, column: 3 },
          end: { line: 1, column: 12 },
        },
      });

      expect(hits[2]).to.deep.equal({ type: "TEXT", text: ",\n" });
      expect(hits[3]).to.deep.equal({ type: "TEXT", text: " b: " });

      expect(hits[4]).to.have.property("expression").that.deep.equal({
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "int",
        },
        arguments: [ {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Literal",
            value: 1,
            loc: {
              source: "1",
              start: { line: 2, column: 9 },
              end: { line: 2, column: 10 },
            },
          },
          right: {
            type: "Literal",
            value: 2,
            loc: {
              source: "2",
              start: { line: 2, column: 11 },
              end: { line: 2, column: 12 },
            },
          },
          loc: {
            source: "1+2",
            start: { line: 2, column: 9 },
            end: { line: 2, column: 12 },
          },
        } ],
        loc: {
          source: "$int(1+2)",
          start: { line: 2, column: 4 },
          end: { line: 2, column: 13 },
        },
      });

      expect(hits[5]).to.deep.equal({ type: "TEXT", text: ",\n" });
      expect(hits[6]).to.deep.equal({ type: "TEXT", text: " c: " });
      expect(hits[7]).to.have.property("expression").with.property("type", "CallExpression");

      expect(hits.length).to.equal(8);
    });

    it("throws SyntaxError with line and column", () => {
      const input = "a: $int(1+1),\n b: $int(1 2),\n c: $int(1+3)";

      expect(() => {
        split(input);
      }).to.throw(SyntaxError, "Unexpected Literal in CallExpression at \"$int(1 2),\" 2:11");
    });
  });
});
