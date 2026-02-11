import Notification from '../models/Notification.js';

// Get all notifications for logged-in user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id
    }).sort({ createdAt: -1 });

    return res.json(notifications);

  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    return res.json(notification);

  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
