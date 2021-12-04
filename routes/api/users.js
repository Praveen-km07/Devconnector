const express =require('express');
const router =express.Router();

//@Route  GET api/users
//@desc   test route
//@access Public
router.get('/',(req,res)=>res.send('User Route'));

module.exports = router;