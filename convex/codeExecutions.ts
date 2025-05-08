import { ConvexError, v } from "convex/values";
import { mutation,query  } from "./_generated/server";

export const saveExecution = mutation ({
    args : {
        language : v.string() ,
        code : v.string() ,
        output : v.optional(v.string()) , 
        error : v.optional(v.string()) ,
    } , 
    handler : async (ctx , args) => {
        const identity = await ctx.auth.getUserIdentity() ;
        console.log("identity") ;
        if (!identity) throw new ConvexError ("Not authenticated") ;
        const user = await ctx.db.query("users").withIndex("by_user_id").filter((q) => q.eq(q.field("userId") , identity.subject)).first() ;
        if (!user?.isPro && args.language !== "javascript") throw new ConvexError ("Pro plan required for using this language") ;

        await ctx.db.insert("codeExecutions" , {
            ...args , 
            userId : identity.subject ,
             
        })
    }
})