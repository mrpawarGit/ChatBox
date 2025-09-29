const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const statusController = require('../controllers/statusController');
const authenticate = require('../middlerwares/authMiddleware');
const { multerMiddleware } = require('../../config/cloudinaryConfig');

const router = express.Router();

router.post('/',authenticate, multerMiddleware,statusController.createStatus)

router.get('/', authenticate, statusController.getStatuses);
router.put('/:statusId/view', authenticate, statusController.viewStatus);
router.delete('/:statusId', authenticate, statusController.deleteStatus);

module.exports = router;
