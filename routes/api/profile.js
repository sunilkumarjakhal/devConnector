const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const request = require('request');
const config = require('config');

const { check, validationResult } = require('express-validator/check');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

// @route api/profile/me
// @desc  Get Current users profile
// @acess Private

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({
        msg: 'There is no profile for this user',
      });
    }

    res.send(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route api/profile/me
// @desc  Get Current users profile
// @acess Private

router.post(
  '/',
  [
    auth,
    [
      check('status', 'status is required').not().isEmpty(),
      check('skills', 'skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    try {
      const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin,
      } = req.body;

      // Get fields
      const profileFields = {};
      profileFields.user = req.user.id;
      if (company) profileFields.company = company;
      if (website) profileFields.website = website;
      if (location) profileFields.location = location;
      if (bio) profileFields.bio = bio;
      if (status) profileFields.status = status;
      if (githubusername) profileFields.githubusername = githubusername;

      if (skills) {
        profileFields.skills = skills.split(',').map((skill) => skill.trim());
      }

      console.log(profileFields.skills);

      // Social
      profileFields.social = {};
      if (youtube) profileFields.social.youtube = youtube;
      if (twitter) profileFields.social.twitter = twitter;
      if (facebook) profileFields.social.facebook = facebook;
      if (linkedin) profileFields.social.linkedin = linkedin;
      if (instagram) profileFields.social.instagram = instagram;

      let profile = await Profile.findOne({
        user: req.user.id,
      });

      if (profile) {
        profile = await Profile.findOneAndUpdate(
          {
            user: req.user.id,
          },
          {
            $set: profileFields,
          },
          {
            new: true,
          }
        );

        return res.json(profile);
      }

      // create

      profile = new Profile(profileFields);

      await profile.save();

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        msg: 'Server Error',
      });
    }

    res.send('Hello');
  }
);

/*

{
    "social": {
        "youtube": "sunil.youtybe",
        "twitter": "sunil.twitter",
        "facebook": "sunil.facebbok",
        "linkedin": "sunil.linkedin",
        "instagram": "sunil.instagram"
    },
    "skills": [
        "Java",
        "React",
        "Node"
    ],
    "_id": "5ead5410bf73c839d85b8582",
    "user": "5eaa3501653c142dbcc99121",
    "company": "MERN",
    "website": "sunil.com",
    "location": "Niyana",
    "bio": "Cool",
    "status": "MERN Developer",
    "githubusername": "suniljakhal",
    "experience": [],
    "education": [],
    "date": "2020-05-02T11:05:52.719Z",
    "__v": 0
}

*/

// @route api/profile
// @desc  Get All users profile
// @acess Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);

    return res.send(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route api/profile/users/:user_id
// @desc  Get profile by user id
// @acess Public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({
        msg: 'There is no profile for this user',
      });
    }

    res.send(profile);
  } catch (err) {
    console.error(err.message);
    if (err.message.indexOf('Cast to ObjectId failed') !== -1) {
      return res.status(400).json({
        msg: 'There is no profile for this user',
      });
    }
    res.status(500).send('Server Error');
  }
});

// @route Delete api/profile
// @desc  Delete user , profile , posts
// @acess Private

router.delete('/', auth, async (req, res) => {
  try {
    // Delete Profile
    await Post.deleteMany({
      user: req.user.id,
    });

    // Delete Profile
    await Profile.findOneAndRemove({
      user: req.user.id,
    });

    // Delete User
    await User.findOneAndRemove({
      _id: req.user.id,
    });

    // Delete Posts
    await Post.findOneAndRemove({ _id: req.user.id });

    return res.status(200).json({
      msg: 'User Deleted',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route PUT api/profile/experience
// @desc  Add experience
// @acess Private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'title is required').not().isEmpty(),
      check('company', 'company is required').not().isEmpty(),
      check('from', 'from is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({
        user: req.user.id,
      });

      profile.experience.unshift(newExp);

      await profile.save();

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route Delete api/profile/experience/:exp_id
// @desc  Delete experience
// @acess Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route PUT api/profile/education
// @desc  Add education
// @acess Private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('from', 'from date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({
        user: req.user.id,
      });

      profile.education.unshift(newEdu);

      await profile.save();

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route Delete api/profile/education/:edu_id
// @desc  Delete education
// @acess Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route api/profile/github/:username
// @desc  Get user repo from Github
// @acess Public

router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?
            per_page=5&sort=created:asc&client_id=${config.get('gitClientID')}
            &client_secret=${config.get('gitClientSecret')}`,
      method: 'GET',
      headers: {
        'user-agent': 'node.js',
      },
    };

    request(options, (error, response, body) => {
      if (error) {
        console.log(error);
      }

      if (response.statusCode !== 200) {
        return res.status(400).json({
          msg: 'No Github profile found',
        });
      }
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
