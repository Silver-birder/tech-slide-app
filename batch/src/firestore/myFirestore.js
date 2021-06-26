const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();

exports.MyFirestore = class MyFirestore {
    constructor(docs, collectioName) {
        this.docs = docs;
        this.collectioName = collectioName;
    }
    async save() {
        return await Promise.all(this.docs.map(async (doc) => {
            let documentRef = firestore.collection(this.collectioName).doc(doc.id);
            const documentSnapshot = await documentRef.get();
            if (documentSnapshot.exists) {
                console.log(`update to ${this.collectioName} (doc.id: ${doc.id})`);
                return await documentRef.update(doc.toJson());
            } else {
                console.log(`create to ${this.collectioName} (doc.id: ${doc.id})`);
                return await documentRef.create(doc.toJson());
            }
        }));
    }
}