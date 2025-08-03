const BlogService = require('../services/blogService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class BlogController {
    
    generateValidFilePath = (filename) => {
        return filename.replace(/\\/g, '/'); // Replace all backslashes with forward slashes
    };

    createBlog = catchAsync(async (req, res, next) => {
        console.log(req.files); // Will contain both image and imagesthubnails files
        console.log(req.body); 
        // Process the main image
        if (req.files && req.files.image) {
            req.body.image = this.generateValidFilePath(req.files.image[0].path); // Save the image path in the database
        }
console.log("aaaaaaaa",req.files.imagesthubnails)
        // Process the thumbnails if they exist
        if (req.files && req.files.imagesthubnails) {
            req.body.imagesthubnails = req.files.imagesthubnails.map(file => this.generateValidFilePath(file.path));
        }

        const blog = await BlogService.createBlog(req.body);
        response(res, 201, blog, 'Blog created successfully');
    });

    getAllBlogs = catchAsync(async (req, res, next) => {
        const blogs = await BlogService.getAllBlogs(req.query);
        response(res, 200, blogs, 'Blogs retrieved successfully');
    });

    getBlogById = catchAsync(async (req, res, next) => {
        const blog = await BlogService.getBlogById(req.params.id);
        response(res, 200, blog, 'Blog retrieved successfully');
    });

    updateBlog = catchAsync(async (req, res, next) => {
        if (req.files && req.files.image) {
            req.body.image = this.generateValidFilePath(req.files.image[0].path);
        }

        if (req.files && req.files.imagesthubnails) {
            req.body.imagesthubnails = req.files.imagesthubnails.map(file => this.generateValidFilePath(file.path));
        }

        const blog = await BlogService.updateBlog(req.params.id, req.body);
        response(res, 200, blog, 'Blog updated successfully');
    });

    deleteBlog = catchAsync(async (req, res, next) => {
        await BlogService.deleteBlog(req.params.id);
        response(res, 204, null, 'Blog deleted successfully');
    });
}

module.exports = new BlogController();
