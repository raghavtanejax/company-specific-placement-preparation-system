import Discussion from '../models/Discussion.js';

// Create a new discussion thread for a question
export const createDiscussion = async (req, res) => {
  try {
    const { questionId, title, body } = req.body;

    if (!questionId || !title || !body) {
      return res.status(400).json({ message: 'Question ID, title, and body are required' });
    }

    const discussion = new Discussion({
      questionId,
      author: req.userId,
      title,
      body,
    });

    await discussion.save();
    await discussion.populate('author', 'name');

    res.status(201).json(discussion);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all discussions for a question
export const getDiscussionsByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sortOption = sort === 'popular'
      ? { upvotes: -1, createdAt: -1 }
      : { createdAt: -1 };

    const total = await Discussion.countDocuments({ questionId });

    const discussions = await Discussion.find({ questionId })
      .populate('author', 'name')
      .populate('replies.author', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      discussions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all discussions (global feed)
export const getAllDiscussions = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sortOption = sort === 'popular'
      ? { upvotes: -1, createdAt: -1 }
      : { createdAt: -1 };

    const total = await Discussion.countDocuments();

    const discussions = await Discussion.find()
      .populate('author', 'name')
      .populate('questionId', 'title difficulty skills')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      discussions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a reply to a discussion
export const addReply = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ message: 'Reply body is required' });
    }

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    discussion.replies.push({
      author: req.userId,
      body,
    });

    await discussion.save();
    await discussion.populate('author', 'name');
    await discussion.populate('replies.author', 'name');

    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle upvote on a discussion
export const toggleDiscussionUpvote = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const userId = req.userId;
    const hasUpvoted = discussion.upvotes.includes(userId);

    if (hasUpvoted) {
      discussion.upvotes = discussion.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      discussion.upvotes.push(userId);
    }

    await discussion.save();
    res.json({ upvotes: discussion.upvotes.length, hasUpvoted: !hasUpvoted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle upvote on a reply
export const toggleReplyUpvote = async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;
    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const userId = req.userId;
    const hasUpvoted = reply.upvotes.includes(userId);

    if (hasUpvoted) {
      reply.upvotes = reply.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      reply.upvotes.push(userId);
    }

    await discussion.save();
    res.json({ upvotes: reply.upvotes.length, hasUpvoted: !hasUpvoted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
