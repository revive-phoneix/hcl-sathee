const User = require("../Models/User");
const generateToken = require("../Utils/GenerateToken");
const { hashPassword, verifyPassword } = require("../Utils/password");

exports.createPassword = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.name?.trim() !== name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name does not match the invited account",
      });
    }

    if (user.password) {
      return res.status(400).json({
        success: false,
        message: "Password already set for this account",
      });
    }

    const hashedPassword = await hashPassword(password);
    await User.update(user.id, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: "Password created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const { valid, needsRehash } = await verifyPassword(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (needsRehash) {
      const hashedPassword = await hashPassword(password);
      await User.update(user.id, { password: hashedPassword });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        centre: user.centre,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
