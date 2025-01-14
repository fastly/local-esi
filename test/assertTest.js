"use strict";

const { parse } = require("./..");

describe("assert", () => {
  describe("esi:choose", () => {
    it("esi:assign as first child of esi:choose throws", async () => {
      const markup = `
      <esi:choose>
        <esi:assign name="my_cookie" value="$(HTTP_COOKIE{'cookie_1'})" />
        <esi:when test="$exists($(my_cookie))">
          <p>hej</p>
        </esi:when>
      </esi:choose>`;

      try {
        await parse(markup, { cookie: { cookie_1: "content" } });
      } catch (e) {
        // eslint-disable-next-line no-var
        var err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:assign is not allowed inside a esi:choose/);
    });

    it("esi:vars as first child of esi:choose throws", async () => {
      const markup = `
      <esi:choose>
        <esi:vars>
          $(HTTP_COOKIE{'cookie_1})
        </esi:vars>
        <esi:when test="$exists($(HTTP_COOKIE{'cookie_1}))">
          <p>hej</p>
        </esi:when>
      </esi:choose>`;

      try {
        await parse(markup, { cookie: { cookie_1: "content" } });
      } catch (e) {
        // eslint-disable-next-line no-var
        var err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:vars is not allowed inside a esi:choose/);
    });

    it("esi:assign inside esi:choose throws", async () => {
      const markup = `
      <esi:choose>
        <esi:when test="$exists($(my_cookie))">
          <p>hej</p>
        </esi:when>
        <esi:assign name="my_cookie" value="$(HTTP_COOKIE{'cookie_1'})" />
      </esi:choose>`;

      try {
        await parse(markup, { cookie: { cookie_1: "content" } });
      } catch (e) {
        // eslint-disable-next-line no-var
        var err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:assign is not allowed inside a esi:choose/);
    });

    it("esi:choose without esi:when throws", async () => {
      const markup = "<esi:choose></esi:choose>";

      let err;
      try {
        await parse(markup);
      } catch (e) {
        err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:choose without esi:when not allowed/);
    });

    it("esi:when outside of esi:choose throws", async () => {
      const markup = `
        <esi:vars>
          <esi:when></esi:when>
        </esi:vars>
      `;

      let err;
      try {
        await parse(markup);
      } catch (e) {
        err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:when is not allowed outside esi:choose/);
    });

    it("esi:otherwise outside of esi:choose throws", async () => {
      const markup = `
        <esi:vars>
          <esi:otherwise></esi:otherwise>
        </esi:vars>
      `;

      let err;
      try {
        await parse(markup);
      } catch (e) {
        err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:otherwise is not allowed outside esi:choose/);
    });
  });

  describe("esi:try", () => {
    it("esi:try without esi:attempt throws", async () => {
      const markup = "<esi:try></esi:try>";

      let err;
      try {
        await parse(markup);
      } catch (e) {
        err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:try without esi:attempt not allowed/);
    });

    it("esi:try without esi:attempt throws", async () => {
      const markup = `
        <esi:try>
          <esi:except></esi:except>
        </esi:try>
      `;

      let err;
      try {
        await parse(markup);
      } catch (e) {
        err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:try without esi:attempt not allowed/);
    });

    it("esi:attempt outside of esi:try throws", async () => {
      const markup = `
        <esi:vars>
          <esi:attempt></esi:attempt>
        </esi:vars>
      `;

      let err;
      try {
        await parse(markup);
      } catch (e) {
        err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:attempt is not allowed outside esi:try/);
    });

    it("esi:except outside of esi:try throws", async () => {
      const markup = `
        <esi:vars>
          <esi:except></esi:except>
        </esi:vars>
      `;

      let err;
      try {
        await parse(markup);
      } catch (e) {
        err = e;
      }

      expect(err).to.exist;
      expect(err.message).to.match(/esi:except is not allowed outside esi:try/);
    });
  });
});
