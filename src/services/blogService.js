const Blog = require('../model/BlogModel');
const CustomError = require('../utils/customError');
const APIFeatures = require('../utils/apiFeatures');

class BlogService {
    async createBlog(data) {
        const blog = new Blog(data);
        await blog.save();
        return blog;
    }


    async getAllBlogs(queryParams) {
        const filter = {};
        let counts = await Blog.find().countDocuments();

        const features = new APIFeatures(Blog.find(filter), queryParams)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const tours = await features.query;
        return {
            results: tours.length,
            counts: counts,
            data: tours
        };
    }

    async getBlogById(id) {
        const blog = await Blog.findById(id);
        if (!blog) {
            throw new CustomError('Blog not found', 404);
        }
        return blog;
    }

    async updateBlog(id, data) {
        const blog = await Blog.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!blog) {
            throw new CustomError('Blog not found', 404);
        }
        return blog;
    }

    async deleteBlog(id) {
        const blog = await Blog.findByIdAndDelete(id);
        if (!blog) {
            throw new CustomError('Blog not found', 404);
        }
        return blog;
    }
}

module.exports = new BlogService();
