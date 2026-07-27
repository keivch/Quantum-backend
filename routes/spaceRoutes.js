const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', spaceController.getSpaces);
router.get('/:id', spaceController.getSpaceById);

router.post('/', authorize('admin'), spaceController.createSpace);
router.put('/:id', authorize('admin'), spaceController.updateSpace);
router.patch('/:id/deactivate', authorize('admin'), spaceController.deactivateSpace);

module.exports = router;
