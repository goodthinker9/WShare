const invitationCodeService = require('../services/invitationCode.service');

class InvitationCodeController {
  async list(req, res, next) {
    try { res.json({ success: true, data: await invitationCodeService.list() }); } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const result = await invitationCodeService.create({ adminId: req.user.id, ...req.body });
      res.status(201).json({ success: true, message: 'Invitation code created.', data: result });
    } catch (error) { next(error); }
  }

  async disable(req, res, next) {
    try { res.json({ success: true, ...(await invitationCodeService.disable(req.params.id)) }); } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try { res.json({ success: true, ...(await invitationCodeService.deleteUnused(req.params.id)) }); } catch (error) { next(error); }
  }
}

module.exports = new InvitationCodeController();