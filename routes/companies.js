"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companySearchFiltersSchema = require("../schemas/companySearchFilters.json");
const User = require("../models/user");

const router = new express.Router();




/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, companyNewSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.create(req.body);
  return res.status(201).json({ company });
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */
// TODO:  Could convert minEmployees, maxEmployees to number here instead of in model.  Better separation of concerns.
// TODO:  Optional:  Could use a validator to validate correct types are passed in and that no extra parameters.  Let them know that 
//        those parameters aren't allowed.  User might think they are getting the information they expect if they put in something like location.
router.get("/", async function (req, res, next) {
  if (req.query.minEmployees) {
    req.query.minEmployees = parseInt(req.query.minEmployees);
    if (isNaN(req.query.minEmployees)) {
      throw new BadRequestError("minEmployees must be a number.");
    }
  }
  if (req.query.maxEmployees) {
    req.query.maxEmployees = parseInt(req.query.maxEmployees);
    if (isNaN(req.query.maxEmployees)) {
      throw new BadRequestError("maxEmployees must be a number.");
    }
  }
  console.log("company route minEmployees: ", req.query.minEmployees);
  const validator = jsonschema.validate(req.query, companySearchFiltersSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  // let { name, minEmployees, maxEmployees } = req.query;
  // if (minEmployees) minEmployees = parseInt(minEmployees);
  // if (maxEmployees) maxEmployees = parseInt(maxEmployees)
  const companies = await Company.findAll(req.query);
  return res.json({ companies });
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  const company = await Company.get(req.params.handle);
  return res.json({ company });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, companyUpdateSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.update(req.params.handle, req.body);
  return res.json({ company });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
  await Company.remove(req.params.handle);
  return res.json({ deleted: req.params.handle });
});


module.exports = router;
