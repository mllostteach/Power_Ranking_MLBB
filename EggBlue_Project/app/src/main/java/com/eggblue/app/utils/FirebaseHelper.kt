package com.eggblue.app.utils
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
object FirebaseHelper {
    val auth = FirebaseAuth.getInstance()
    val db = FirebaseFirestore.getInstance()
    val storage = FirebaseStorage.getInstance()
    val currentUserUid get() = auth.currentUser?.uid
    val currentUserEmail get() = auth.currentUser?.email
    fun getUserTaskCollection(uid: String) = db.collection("users").document(uid).collection("tasks")
    fun getUserDiaryCollection(uid: String) = db.collection("users").document(uid).collection("diaries")
}