const express = require('express');
const router = express.Router();
const { getCountries, createCountry, deleteCountry } = require('../controllers/countryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getCountries).post(createCountry);
router.route('/:id').delete(deleteCountry);

module.exports = router;
