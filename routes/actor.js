const express = require("express");
const { uploadImage } = require("../middlewares/multer");
const { createActor, updateActor, removeActor, searchActor, getSingleActor, getLatestActors, getActors } = require("../controllers/actor");
const { actorInfoValidator, validate } = require("../middlewares/validator");
const { isAuth, isAdmin } = require("../middlewares/auth");
const router = express.Router();

router.post('/create',isAuth,isAdmin,uploadImage.single('avatar'),actorInfoValidator,actorInfoValidator,validate,(createActor))

router.post('/update/:actorId',isAuth,isAdmin,uploadImage.single('avatar'),actorInfoValidator,actorInfoValidator,validate,(updateActor))


router.delete("/:actorId",isAuth,isAdmin, removeActor);
router.get("/search",isAuth,isAdmin, searchActor);
router.get("/latest-uploads",isAuth,isAdmin, getLatestActors);
router.get("/single/:id", getSingleActor);
router.get("/actors", isAuth, isAdmin, getActors); 



module.exports = router;
