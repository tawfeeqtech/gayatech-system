const express = require('express');
const router = express.Router();
const { getCities, createCity, deleteCity } = require('../controllers/cityController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getCities).post(createCity);
router.route('/:id').delete(deleteCity);

module.exports = router;
