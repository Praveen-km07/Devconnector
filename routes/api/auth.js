const express =require('express');
const router =express.Router();

//@Route  GET api/auth
//@desc   test route
//@access Public
router.get('/',(req,res)=>res.send('Auth Route'));

module.exports = router;