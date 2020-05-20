const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const request = require('request');
const config = require('config');

const { check, validationResult } = require('express-validator/check');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

// @route POST api/posts
// @desc  create Post
// @acess Private

router.post(
  '/',
  [auth, [check('text', 'text is not empty').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route Get api/posts
// @desc  Get All Post
// @acess Private

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find({}).sort({
      date: -1,
    });

    res.send(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route api/posts/:id
// @desc  Get Post by id
// @acess Private

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(400).json({
        msg: 'There is no post for this id',
      });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.message.indexOf('Cast to ObjectId failed') !== -1) {
      return res.status(400).json({
        msg: 'There is no post for this id',
      });
    }
    res.status(500).send('Server Error');
  }
});

// @route Delete api/posts
// @desc  Delete posts
// @acess Private

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(400).json({
        msg: 'There is no post for this id',
      });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: 'User not authorized',
      });
    }

    await post.remove();

    res.json({
      msg: 'Post removed',
    });
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.message.indexOf('Cast to ObjectId failed') !== -1) {
      return res.status(400).json({
        msg: 'There is no post for this id',
      });
    }
    res.status(500).send('Server Error');
  }
});

// @route PUT api/posts/like/:id
// @desc  Like a post
// @acess Private

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.json(post.likes);
      //   return res.status(400).json({
      //     msg: 'Post already liked',
      //   });
    }

    post.likes.unshift({
      user: req.user.id,
    });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route PUT api/posts/unlike/:id
// @desc  unlike a post
// @acess Private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      //   return res.status(400).json({
      //     msg: 'Post not yet liked',
      //   });
      return res.json(post.likes);
    }

    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route POST api/posts/comment/:id
// @desc  Comment on post
// @acess Private

router.post(
  '/comment/:id',
  [auth, [check('text', 'text is not empty').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route POST api/posts/comment/:id/:comment_id
// @desc  delete Comment from post
// @acess Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const comment = await post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Check to see if comment exists
    if (!comment) {
      return res.status(404).json({
        msg: 'Comment does not exist',
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: 'user  Not authorized',
      });
    }

    // Get remove index
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    // Splice comment out of array
    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post);
  } catch (err) {
    res.status(404).json({
      postnotfound: 'No post found',
    });
  }
});

module.exports = router;
