// Links a file under All_Metro_SPC_MR2 to its SharePoint page. Inferred from the library path until Graph gives each file's webUrl.
const site = 'https://utexas.sharepoint.com/sites/TIEEquipment-Equipment';
const root = '/sites/TIEEquipment-Equipment/Shared Documents/Equipment/MR2/Tools/0_Metrology/All_Metro_SPC_MR2';

const encode = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export const sharepointUrl = (file: string) => {
    const id = `${root}/${file}`;
    const parent = id.slice(0, id.lastIndexOf('/'));
    return `${site}/Shared%20Documents/Forms/AllItems.aspx?id=${encode(id)}&parent=${encode(parent)}`;
};
