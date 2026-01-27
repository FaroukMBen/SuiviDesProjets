const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.get('/conversations', authenticate, ChatController.getConversations);
router.get('/messages/:conversationId', authenticate, ChatController.getMessages);
router.post('/send', authenticate, ChatController.sendMessage);
router.post('/start', authenticate, ChatController.startConversation);
router.post('/create-group', authenticate, ChatController.createGroup);
router.post('/invite-group', authenticate, ChatController.inviteToGroup);
router.post('/leave-group', authenticate, ChatController.leaveGroup);
router.post('/remove-member', authenticate, ChatController.removeMember);
router.delete('/:id', authenticate, ChatController.deleteConversation);

module.exports = router;
