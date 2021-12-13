const express =require('express');
const router =express.Router();
const auth =require('../../middleware/auth');
const {check,validationResult} = require('express-validator');
const Profile = require('../../models/Profile');
const request = require('request');
const config=require('config');
const User = require('../../models/User');
const { findById } = require('../../models/Profile');
const { response } = require('express');

//@Route  GET api/profile/me
//@desc   Get current user profile route
//@access Private
router.get('/me',auth,async (req,res)=>{
    try
    {
        const profile = await Profile.findOne({user:req.user.id}).populate('user',
        [
            'name','avatar'
        ]);

        if(!profile)
        {
            return res.status(400).json({msg:'There is no profile for this user'})
        }
        res.json(profile);
    }
    catch(err)
    {
       console.error(err.message);
       res.status(500).send('Server Error');
    }
});


//@Route  Post api/profile
//@desc   create or update user profile
//@access Private
router.post('/',[auth,
    [
        check('status','Status is required').not().notEmpty(),
        check('skills','Skills is required').not().isEmpty()
    ]

    ],async (req,res)=>{
     const errors = validationResult(req);
     if(!errors.isEmpty()){
         return res.status(400).json({errors:errors.array()})
     }

     const {
         company,
         website,
         location,
         bio,
         status,
         githubusername,
         skills,
         youtube,
         facebook,
         twitter,
         instagram,
         linkedin
     } =req.body;

     //build profile object
     const profileFields = {};
     profileFields.user =req.user.id;
     if(company) profileFields.company=company;
     if (website) profileFields.website=website;
     if(location) profileFields.location=location;
     if(bio) profileFields.bio=bio;
     if(status) profileFields.status=status;
     if(githubusername) profileFields.githubusername=githubusername;
     if(skills)
     { 
         profileFields.skills =skills.split(',').map(skill=>skill.trim());
     }
     //Build social object
     profileFields.social = {};
     if(youtube) profileFields.social.youtube=youtube;
     if(twitter) profileFields.social.twitter=twitter;
     if(facebook) profileFields.social.facebook=facebook;
     if(linkedin) profileFields.social.linkedin=linkedin;
     if(instagram) profileFields.social.instagram=instagram;

     try
     {
          let profile=await Profile.findOne({user:req.user.id});
          if(profile)
          {
              //update
              profile = await Profile.findOneAndUpdate(
                  {user:req.user.id},
                  {$set:profileFields},
                  {new:true}
                  );

                  return res.json(profile);
          }
          //create
          profile= new Profile(profileFields);

          await profile.save();
          res.json(profile);
     }
     catch(err){
         console.error(err.message);
         res.status(500).send('Server Error');
     }
});


//@Route  GET api/profile
//@desc   get all profile
//@access public

router.get('/',async (req,res)=>{
    try {
        const profiles =await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@Route  GET api/profile/user/:user_id
//@desc   get  profile by user id
//@access public

router.get('/user/:user_id',async (req,res)=>{
    try {
        const profile =await Profile.findOne({user:req.params.user_id}).populate('user',['name','avatar']);
        if(!profile) return res.status(400).json({msg:"Profile not found"});
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind=='ObjectId')
        {
            return res.status(400).json({msg:"Profile not found"});
        }
        res.status(500).send('Server Error');
    }
});

//@Route  DELETE api/profile
//@desc   Delete  profile,user & posts
//@access public

router.delete('/',auth,async (req,res)=>{
    try {
        //@todo - remove users post
        //Remove profile
        await Profile.findOneAndRemove({user:req.user.id});
        //Remove user
        await Profile.findOneAndRemove({_id:req.user.id});
        res.json({msg:'User deleted'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@Route  PUT api/profile/experience
//@desc   add profile experience
//@access private
router.put('/experience',[auth,[
    check('title','Title is required').not().isEmpty(),
    check('company','Company is required').not().isEmpty(),
    check('from','From Date is required').not().isEmpty()
]],async (req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } =req.body;

    let newExp={
      title,
      company,
      location,
      from,
      to,
      current,
      description
    }; 
    
    try
    {
       const profile = await Profile.findOne({user:req.user.id});
       if(profile)
       {
           console.log("Entering the update");
        //    console.log(findById(profile.experience));
           console.log(profile.experience[0]._id);
           console.log(req.body);
         //update the experience
          profile = await Profile.findOneAndUpdate(
           {user:req.user.id},{$set:{"newExp":req.body}},
           {new:true});
          return res.json(profile);
       }
       else
       {
           console.log("entering the new update");
           profile.experience.unshift(newExp);
           await  profile.save();
           res.json(profile);
       }
    
    //   profile=new Profile(newExp);
     
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@Route  DELETE api/profile/experience/:exp_id
//@desc   Delete  experience from profile
//@access private

router.delete('/experience/:exp_id',auth,async (req,res)=>{
    try {
        
        const profile=await Profile.findOne({user:req.user.id});

        //get remove index
        const removeIndex=profile.experience.map(item=>item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


//@Route  PUT api/profile/education
//@desc   add profile education
//@access private
router.put('/education',[auth,[
    check('school','School is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('fieldofstudy','Field of study is required').not().isEmpty(),
    check('from','From Date is required').not().isEmpty()
]],async (req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } =req.body;

    const newEdu={
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    };
      
        
    
    try
    {
       const profile = await Profile.findOne({user:req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@Route  DELETE api/profile/education/:edu_id
//@desc   Delete  education from profile
//@access private

router.delete('/education/:edu_id',auth,async (req,res)=>{
    try {
        
        const profile=await Profile.findOne({user:req.user.id});

        //get remove index
        const removeIndex=profile.education.map(item=>item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@Route  GET api/profile/github/:username
//@desc   Get user repos from Github
//@access public
router.get('/github/:username',async (req,res)=>{
    try
    {
       const options ={
           uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}
           &client_secret=${config.get('githubSecret')}`,
           method:'GET',
           headers:{'user-agent':'node.js'}
       };
       request(options,(error,response,body)=>{
           if(error) console.error(error);

           if(response.statusCode !==200){
              return res.status(400).json({msg:'No Github profile found'});
           }
           res.json(JSON.parse(body));
       })
    }
    catch(err)
    {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;