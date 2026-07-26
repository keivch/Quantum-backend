const spaceService = require('../services/spaceService');

exports.getSpaces = async (req, res, next) => {
  try {
    const spaces = await spaceService.getAllSpaces();
    res.json(spaces);
  } catch (error) {
    next(error);
  }
};

exports.getSpaceById = async (req, res, next) => {
  try {
    const space = await spaceService.getSpaceById(req.params.id);
    res.json(space);
  } catch (error) {
    next(error);
  }
};

exports.createSpace = async (req, res, next) => {
  try {
    const space = await spaceService.createSpace(req.body);
    res.status(201).json(space);
  } catch (error) {
    next(error);
  }
};

exports.updateSpace = async (req, res, next) => {
  try {
    const space = await spaceService.updateSpace(req.params.id, req.body);
    res.json(space);
  } catch (error) {
    next(error);
  }
};

exports.deactivateSpace = async (req, res, next) => {
  try {
    const space = await spaceService.deactivateSpace(req.params.id);
    res.json(space);
  } catch (error) {
    next(error);
  }
};
