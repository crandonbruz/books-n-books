const { User, Book } = require("../models");
const { AuthenticationError } = require("@apollo/server");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({})
          .select("-_v -password")
          .populate("books");
        return userData;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("User is not found");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Wrong Password");
      }

      const token = signToken(user);

      return { token, user };
    },
  },
  saveBook: async (parent, args, context) => {
    if (context.user) {
      const updateUser = await User.findByIdAndUpdate(
        {
          _id: context.user._id,
        },
        { $addToSet: { savedBooks: args.input } },
        { new: true }
      );

      return updateUser;
    }
    throw AuthenticationError;
  },
  removeBook: async (parent, args, context) => {
    if (context.user) {
      return User.findOneAndUpdate(
        { _id: context.user._id },
        {
          $pull: { savedBooks: { bookid: args.bookid } },
        },
        { new: true }
      );
    }
    throw new AuthenticationError("You need to be logged in");
  },
};
