const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

/**
 * Signs up a new user.
 * @function signup
 * @param {Object} req - The request object containing user details.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} - A JSON response with a success message and user ID or an error message.
 */
exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, name, password } = req.body;

    try {
        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({ email, password: hashedPw, name });
        const result = await user.save();
        res.status(201).json({ message: 'User created!', userId: result._id });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Logs in an existing user.
 * @function login
 * @param {Object} req - The request object containing user credentials.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} - A JSON response with a success message, user ID, and token or an error message.
 */
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'A user with this email could not be found.' });
        }

        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            return res.status(401).json({ message: 'Wrong password!' });
        }

        const token = jwt.sign(
            { email: user.email, id: user._id.toString() },
            process.env.JWT_SECRET || 'secret', // Use environment variable for secret
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'User logged in successfully!', userId: user._id, token });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Retrieves the status of the logged-in user.
 * @function getUserStatus
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} - A JSON response with the user's status or an error message.
 */
exports.getUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ status: user.status });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Updates the status of the logged-in user.
 * @function updateUserStatus
 * @param {Object} req - The request object containing the new status.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} - A JSON response with a success message or an error message.
 */
exports.updateUserStatus = async (req, res, next) => {
    const newStatus = req.body.status;

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.status = newStatus;
        await user.save();
        res.status(200).json({ message: 'User updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
