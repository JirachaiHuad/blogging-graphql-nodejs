import bcrypt from 'bcryptjs';

import getUserId from '../utils/getUserId';
import generateToken from '../utils/generateToken';
import hashPassword from '../utils/hashPassword';

const Mutation = {
  // ---------------------------------
  // ============= LOGIN =============
  // ---------------------------------
  async login (parent, { data }, { prisma }, info) {
    const user = await prisma.query.user({ where: { email: data.email } });

    if (!user) {
      throw new Error('Unable to login');
    }

    const isPasswordMatch = await bcrypt.compare(data.password, user.password);

    if (!isPasswordMatch) {
      throw new Error('Unable to login');
    }

    return {
      user,
      token: generateToken(user.id)
    }
  },

  // ---------------------------------
  // ============= USER ==============
  // ---------------------------------

  async createUser (parent, { data }, { prisma }, info) {
    const emailTaken = await prisma.exists.User({ email: data.email });

    if (emailTaken) {
      throw new Error("Email taken!");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.mutation.createUser({
      data: {
        ...data,
        password: hashedPassword
      }
    });

    return {
      user,
      token: generateToken(user.id)
    };
  },

  async updateUser (parent, { data }, { prisma, request }, info) {
    const userId = getUserId(request);

    if (typeof data.password === 'string') {
      data.password = await hashPassword(data.password);
    }

    return prisma.mutation.updateUser({
      where: { id: userId },
      data
    }, info);
  },

  deleteUser (parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.mutation.deleteUser({ where: { id: userId } }, info);
  },

  // ---------------------------------
  // ============= POST ==============
  // ---------------------------------

  createPost (parent, { data }, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.mutation.createPost({
      data: {
        ...data,
        author: {
          connect: {
            id: userId
          }
        }
      }
    }, info);
  },

  async updatePost (parent, { id, data }, { prisma, request }, info) {
    const userId = getUserId(request);

    const postExists = await prisma.exists.Post({
      id,
      author: {
        id: userId
      }
    });

    if (!postExists) {
      throw new Error('Unable to update post');
    }

    const isPublished = await prisma.exists.Post({
      id,
      published: true
    });

    if (!isPublished && data.published === false) {
      await prisma.mutation.deleteManyComments({
        where: {
          post: {
            id
          }
        }
      });
    }

    return prisma.mutation.updatePost({
      where: { id },
      data
    }, info);
  },

  async deletePost (parent, { id }, { prisma, request }, info) {
    const userId = getUserId(request);

    const postExists = await prisma.exists.Post({
      id,
      author: {
        id: userId
      }
    });

    if (!postExists) {
      throw new Error('Unable to delete post');
    }

    return prisma.mutation.deletePost({ where: { id } }, info);
  },

  // ---------------------------------
  // ============= COMMENT ===========
  // ---------------------------------

  async createComment (parent, { data }, { prisma, request }, info) {
    const userId = getUserId(request);
    const postExists = await prisma.exists.Post({
      id: data.post,
      published: true
    });

    if (!postExists) {
      throw new Error('Unable to find post');
    }

    return prisma.mutation.createComment({
      data: {
        text: data.text,
        author: {
          connect: {
            id: userId
          }
        },
        post: {
          connect: {
            id: data.post
          }
        }
      }
    }, info);
  },

  async updateComment (parent, { id, data }, { prisma, request }, info) {
    const userId = getUserId(request);

    const commentExists = await prisma.exists.Comment({
      id,
      author: {
        id: userId
      }
    });

    if (!commentExists) {
      throw new Error('Unable to update comment');
    }

    return prisma.mutation.updateComment({
      where: { id },
      data
    }, info);
  },

  async deleteComment (parent, { id }, { prisma, request }, info) {
    const userId = getUserId(request);

    const commentExists = await prisma.exists.Comment({
      id,
      author: {
        id: userId
      }
    });

    if (!commentExists) {
      throw new Error('Unable to delete comment');
    }

    return prisma.mutation.deleteComment({ where: { id } }, info);
  }
};

export default Mutation;
