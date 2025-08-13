function safeLang(l){
  try{
    var langs = (monaco && monaco.languages && monaco.languages.getLanguages)
      ? monaco.languages.getLanguages() : [];
    for (var i=0;i<langs.length;i++){ if(langs[i] && langs[i].id===l) return l; }
    return 'plaintext';
  }catch(e){ return 'plaintext'; }
}



async function chooseExistingDir(){ try{ await __openPickerAndWait(); }catch(e){ status("Cancelled or no permission."); } }


async function createNewDir(){ try{ await __openPickerAndWait(); }catch(e){ status("Cancelled or no permission."); } }
