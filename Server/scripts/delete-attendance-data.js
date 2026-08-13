const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, "../firebase-service-account.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://hcl-sathee.firebaseapp.com",
  });
}

const db = admin.firestore();

async function deleteCollectionData(collectionName) {
  console.log(`\n🗑️  Starting deletion of '${collectionName}' collection data...`);
  
  try {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log(`✅ Collection '${collectionName}' is already empty.`);
      return 0;
    }

    const batchSize = 100;
    let deletedCount = 0;

    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = docs.slice(i, i + batchSize);

      chunk.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += chunk.length;
      console.log(`   📊 Deleted ${deletedCount}/${docs.length} documents...`);
    }

    console.log(`✅ Successfully deleted ${deletedCount} documents from '${collectionName}'`);
    return deletedCount;
  } catch (error) {
    console.error(`❌ Error deleting '${collectionName}':`, error.message);
    throw error;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("⚠️  DELETING ALL ATTENDANCE DATA");
  console.log("=".repeat(60));
  console.log("\nThis will permanently delete:");
  console.log("  • All data in 'studentAttendances' collection");
  console.log("  • All data in 'subjectAttendances' collection");
  console.log("\nThe collections themselves will remain (empty).");
  console.log("=".repeat(60));

  try {
    const studentAttCount = await deleteCollectionData("studentAttendances");
    const subjectAttCount = await deleteCollectionData("subjectAttendances");

    console.log("\n" + "=".repeat(60));
    console.log("✅ DELETION COMPLETE");
    console.log("=".repeat(60));
    console.log(`\n📈 Summary:`);
    console.log(`   • studentAttendances: ${studentAttCount} documents deleted`);
    console.log(`   • subjectAttendances: ${subjectAttCount} documents deleted`);
    console.log(`   • Total: ${studentAttCount + subjectAttCount} documents deleted\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Deletion failed:", error.message);
    process.exit(1);
  }
}

main();
