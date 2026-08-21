const resourceService = require('../services/resource.service');

class ResourceController {
  async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File is required.',
          error: 'FILE_REQUIRED'
        });
      }

const result = await resourceService.upload({
        uploaderId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        courseId: req.body.courseId,
        resourceTypeId: req.body.resourceTypeId,
        category: req.body.category,
        chapter: req.body.chapter,
        departmentId: req.body.departmentId,
        academicLevelId: req.body.academicLevelId,
        semesterId: req.body.semesterId,
        file: req.file
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: { id: result.id, status: result.status }
      });
    } catch (error) {
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, () => {});
      }
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const result = await resourceService.getDashboardResources(req.user.id, {
        page: req.query.page,
        limit: req.query.limit,
        category: req.query.category
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const result = await resourceService.search({
        query: req.query.q,
        departmentId: req.query.departmentId,
        academicLevelId: req.query.academicLevelId,
        semesterId: req.query.semesterId,
        courseId: req.query.courseId,
        page: req.query.page,
        limit: req.query.limit
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const resource = await resourceService.getById(req.params.id);

      res.json({
        success: true,
        data: resource
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
const result = await resourceService.update(req.params.id, {
        title: req.body.title,
        description: req.body.description,
        courseId: req.body.courseId,
        category: req.body.category,
        chapter: req.body.chapter,
        departmentId: req.body.departmentId,
        academicLevelId: req.body.academicLevelId,
        semesterId: req.body.semesterId
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await resourceService.delete(req.params.id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async review(req, res, next) {
    try {
      const result = await resourceService.review(req.params.id, {
        status: req.body.status,
        rejectionReason: req.body.rejectionReason,
        reviewerId: req.user.id
      });

      res.json({
        success: true,
        message: result.message,
        data: { status: result.status }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPending(req, res, next) {
    try {
      const result = await resourceService.getPendingResources({
        page: req.query.page,
        limit: req.query.limit
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await resourceService.getAllResources({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        search: req.query.search,
        departmentId: req.query.departmentId,
        category: req.query.category
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async previewFile(req, res, next) {
    try {
      const resource = await resourceService.getFileForPreview(req.params.id, req.user.role);
      const fs = require('fs');
      const path = require('path');
      const filePath = path.resolve(resource.file_path);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server.',
          error: 'FILE_NOT_FOUND'
        });
      }

      // Determine how to serve based on file type
      const ext = (resource.file_extension || '').toLowerCase();

      // Previewable in browser (PDF, images) - inline
      if (['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        res.setHeader('Content-Type', resource.mime_type);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resource.original_file_name)}"`);
        return fs.createReadStream(filePath).pipe(res);
      }

      // Video files - stream for preview
      if (['.mp4', '.avi', '.mkv', '.mov'].includes(ext)) {
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': resource.mime_type,
          });
          fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': resource.mime_type,
          });
          fs.createReadStream(filePath).pipe(res);
        }
        return;
      }

      // For documents/archives - trigger download since browser can't inline them
      const urlPath = `/uploads/${path.basename(resource.file_path)}`;
      res.json({
        success: true,
        message: 'This file type cannot be previewed inline. Download to view it.',
        data: { url: urlPath, fileExtension: ext, originalName: resource.original_file_name }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ResourceController();

