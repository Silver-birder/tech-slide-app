const {Firestore} = require('@google-cloud/firestore');

// Create a new client
const firestore = new Firestore();

async function quickstart() {
  // documentRef.create({foo: 'bar', id: 'AAAAAA'}).then((res) => {
  //   console.log(`Document created at ${res.updateTime}`);
  // }).catch((err) => {
  //   console.log(`Failed to create document: ${err}`);
  // });
  let bulkWriter = firestore.bulkWriter();
  // let documentRef = firestore.collection('tweets').doc("XXX");
  // let documentRef2 = firestore.collection('tweets').doc("XXX");
  let documentRef3 = firestore.collection('tweets').doc("YYY");
  // bulkWriter.create(documentRef, {foo: 'bar'});
  // bulkWriter.update(documentRef2, {foo: 'bar2'});
  bulkWriter.update(documentRef3, {foo: 'bar3'});
  // bulkWriter.update(documentRef2, {foo: 'bar'});
  bulkWriter
  .onWriteError((error) => {
    if (
      error.code === GrpcStatus.UNAVAILABLE &&
      error.failedAttempts < MAX_RETRY_ATTEMPTS
    ) {
      return true;
    } else {
      console.log('Failed write at document: ', error.documentRef);
      return false;
    }
  });
  bulkWriter.onWriteResult((documentRef, result) => {
    console.log(
      'Successfully executed write on document: ',
      documentRef,
      ' at: ',
      result
    );
  });
  await bulkWriter.close().then(() => {
    console.log('Executed all writes');
  })
  // Obtain a document reference.
  // const document = firestore.doc('tweet/a');

  // // Enter new data into the document.
  // await document.set({
  //   title: 'Welcome to Firestore',
  //   body: 'Hello World',
  // });
  // console.log('Entered new data into the document');

  // // Update an existing document.
  // await document.update({
  //   body: 'My first Firestore app',
  // });
  // console.log('Updated an existing document');

  // // Read the document.
  // const doc = await document.get();
  // console.log('Read the document');

  // // Delete the document.
  // await document.delete();
  // console.log('Deleted the document');
}
quickstart();