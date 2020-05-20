const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');

const {
    check,
    validationResult
} = require('express-validator/check');

const User = require('../../models/User');
// @route api/users
// @desc  Register route
// @acess Public

router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter password with 6 or more length').isLength({
            min: 6,
        }),
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }

        const {
            name,
            email,
            password
        } = req.body;

        try {
            let user = await User.findOne({
                email,
            });
            if (user) {
                return res.status(400).json({
                    errors: [{
                        msg: 'User already exist',
                    }, ],
                });
            }

            const avatar = gravatar.url(req.body.email, {
                s: '200', // Size
                r: 'pg', // Rating
                d: 'mm', // Default
            });
            user = new User({
                name,
                email,
                password,
                avatar,
            });

            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            await user.save();

            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(payload, config.get('jwtSecret'), {
                    expiresIn: 360000
                },
                (err, token) => {
                    if (err) {
                        throw err;
                    }
                    res.json({
                        token
                    })
                }

            )


            //  res.send('User Registered!');
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;