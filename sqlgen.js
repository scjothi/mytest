/*!
 * jQuery JavaScript Library v1.6
 * http://jquery.com/
 *
 * Copyright 2011, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2011, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Mon May 2 13:50:00 2011 -0400
 */

var x = "USE IMPERIO\n"+
"GO\n"+
"\n"+
"DECLARE @Application_CK int\n"+
"SELECT @Application_CK=Application_CK FROM Application WHERE application_name = '{0}'\n"+ //Provider Portal
"\n"+
"-- define constants\n"+
"DECLARE @ComponentName varchar(50)\n"+
"SET @ComponentName = '{1}'\n"+  //ProviderSSOInbound
"\n"+
"DECLARE @UpdateLoginName varchar(50)\n"+
"SET @UpdateLoginName = 'CNR_Script'\n"+
"\n"+
"DECLARE @ListName varchar(50)\n"+
"SET @ListName = '{2}'\n"+  //IssuerConfigs
"\n"+
"-- find component CK and insert component if needed \n"+
"IF  NOT EXISTS (SELECT * FROM Component WHERE Component_Name = @ComponentName)\n"+
"BEGIN\n"+
"    INSERT INTO Component (Component_Name, Update_Login_Name) VALUES (@ComponentName, @UpdateLoginName)\n"+
"END\n"+
"DECLARE @Component_CK int\n"+
"SELECT @Component_CK=Component_CK FROM Component WHERE component_name = @ComponentName\n"+
"\n"+
"-- find list CK and insert list if needed\n"+
"DECLARE @List_CK int\n"+
"IF  NOT EXISTS (SELECT * FROM List WHERE component_ck = @Component_CK and application_ck = @Application_CK and list_name = @ListName)\n"+
"BEGIN\n"+
"    INSERT INTO List (list_name, application_ck, component_ck, pattern, comment, update_login_name) VALUES (@ListName, @Application_CK, @Component_CK, '.*', '{3}', @UpdateLoginName)\n"+
"END\n"+
"SELECT @List_CK=list_ck FROM List WHERE list_name=@ListName and component_ck = @Component_CK and application_ck = @Application_CK\n"+
"\n"+
"{4}";

var pairDel0 = "-- delete data from pair table if applicable \n"+
"DELETE FROM Pair WHERE list_ck in (SELECT list_ck FROM List WHERE component_ck = @Component_CK and application_ck = @Application_CK and list_name = @ListName)\n"+
"\n";

var pairIns0 = "-- insert pairs\n"+
"{0}"+

"SELECT COUNT(*) as Pairs_Count FROM pair (NOLOCK) WHERE list_ck IN (SELECT list_ck FROM list (NOLOCK) WHERE component_ck = @Component_CK and application_ck = @Application_CK and list_name = @ListName)\n"+
"";

var pairInsN = "INSERT INTO Pair (list_ck, name, value, comment, update_login_name, seq) VALUES (@List_CK,'{0}','{1}','{2}',@UpdateLoginName,0)\n"+
"\n";


function getInsertPairSQL(delPairs)
{
var pairSql = '';
var pairInsSql = '';
for (c=0; c< vals.length; c++ )
{
  var row = vals[c];
  //alert(vals[c].a);
  pair =  vals[c].a;
  pairvalue =  vals[c].b;
  paircomment = vals[c].c;
  pairInsSql = pairInsSql + pairInsN.f(pair,pairvalue,paircomment);
}

if(vals.length > 0)
{
	if(delPairs)
	{
      pairSql =  pairDel0 + pairIns0.f(pairInsSql);
	}
	else
	{
	  pairSql =  pairIns0.f(pairInsSql);
	}
}

//alert(pairSql);
return pairSql;
}


String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

////////////////////

var y = "USE IMPERIO\n"+
"GO\n"+
"\n"+
"DECLARE @Application_CK int\n"+
"SELECT @Application_CK=Application_CK FROM Application WHERE application_name = '{0}'\n"+
"\n"+
"-- define constants\n"+
"DECLARE @ComponentName varchar(50)\n"+
"SET @ComponentName = '{1}'\n"+
"\n"+
"DECLARE @UpdateLoginName varchar(50)\n"+
"SET @UpdateLoginName = 'CNR_Script'\n"+
"\n"+
"DECLARE @ListName varchar(50)\n"+
"SET @ListName = '{2}'\n"+
"\n"+
"-- find component CK and delete lists associated\n"+
"IF  EXISTS (SELECT * FROM Component WHERE Component_Name = @ComponentName)\n"+
"BEGIN\n"+
"    \n"+
"DECLARE @Component_CK int\n"+
"SELECT @Component_CK=Component_CK FROM Component WHERE component_name = @ComponentName\n"+
"\n"+
"-- find list CK and delete if it exists\n"+
"DECLARE @List_CK int\n"+
"IF EXISTS (SELECT * FROM List WHERE component_ck = @Component_CK and application_ck = @Application_CK and list_name = @ListName)\n"+
"{3}"+ //for backoutDel
"\n"+
"SELECT COUNT(*) as Pairs_Count FROM pair (NOLOCK) WHERE list_ck IN (SELECT list_ck FROM list (NOLOCK) WHERE component_ck = @Component_CK and application_ck = @Application_CK and list_name = @ListName)\n"+
"END\n"+
"";


var backoutDel = "BEGIN\n"+
"-- delete data from the Pair table\n"+
"{0}"+  //for backoutAllPairDel or  backoutSelPairDel
"{1}"+ //for backoutListDel
"END\n";

var backoutAllPairDel = "  DELETE FROM Pair WHERE list_ck in (SELECT list_ck FROM List WHERE component_ck = @Component_CK and application_ck = @Application_CK and list_name = @ListName)\n";


var backoutSelPairDel = "DELETE FROM Pair WHERE pair_ck in\n"+
"    ( SELECT pair_ck FROM Pair WHERE list_ck in (SELECT list_ck FROM List WHERE component_ck = @Component_CK and application_ck = @Application_CK and list_name = @ListName)\n"+
"      and name in ({0})\n"+
"     )\n";

var backoutListDel = "-- delete list from the List table\n"+
"--DELETE FROM List WHERE list_name=@ListName and component_ck = @Component_CK and application_ck = @Application_CK\n";

function getRollBackSQL(rollbackDelOpt)
{

    var res = '';
    if(rollbackDelOpt == 'delList')
    {
       res = res + backoutDel.f(backoutAllPairDel,backoutListDel);
    }
    else if(rollbackDelOpt == 'delAllPairs')
    {
       res = res + backoutDel.f(backoutAllPairDel,"");
    }
    else if(rollbackDelOpt == 'delSelPairs')
    {
		var temp = '';
		for (c=0; c< vals.length; c++ )
        { 
          temp = temp + "'" + vals[c].a + "',";
		}
		//alert(temp);
       res = res + backoutDel.f(backoutSelPairDel.f(temp.substring(0,temp.length-1)),"");
    }
    //alert(res);
	return res;

}