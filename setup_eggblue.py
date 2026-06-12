import os
import zipfile

PROJECT_DIR = "EggBlue_Project"
ZIP_NAME = "EggBlue_Project.zip"

FILES = {
    "app/build.gradle": '''plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'com.google.gms.google-services'
}
android {
    namespace 'com.eggblue.app'
    compileSdk 34
    defaultConfig {
        applicationId "com.eggblue.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
    buildFeatures { viewBinding true }
    compileOptions { sourceCompatibility JavaVersion.VERSION_17; targetCompatibility JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = '17' }
}
dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-auth-ktx'
    implementation 'com.google.firebase:firebase-firestore-ktx'
    implementation 'com.google.firebase:firebase-storage-ktx'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    implementation 'de.hdodenhof:circleimageview:3.1.0'
}''',

    "app/src/main/AndroidManifest.xml": '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.eggblue.app">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <application android:allowBackup="true" android:icon="@mipmap/ic_launcher" android:label="EggBlue" android:supportsRtl="true" android:theme="@style/Theme.EggBlue">
        <activity android:name=".activities.LoginActivity" android:exported="true">
            <intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>
        </activity>
        <activity android:name=".activities.RegisterActivity"/>
        <activity android:name=".MainActivity"/>
    </application>
</manifest>''',

    "app/src/main/res/values/strings.xml": '''<resources>
    <string name="app_name">EggBlue</string>
    <string name="login">Đăng nhập</string>
    <string name="register">Đăng ký</string>
    <string name="email">Email</string>
    <string name="password">Mật khẩu</string>
    <string name="confirm_password">Xác nhận mật khẩu</string>
    <string name="home">Trang chủ</string>
    <string name="diary">Nhật ký</string>
    <string name="ai_chat">AI Chat</string>
    <string name="account">Tài khoản</string>
    <string name="task_name">Tên công việc</string>
    <string name="task_note">Ghi chú</string>
    <string name="select_date">Chọn ngày</string>
    <string name="select_time">Chọn giờ</string>
    <string name="complete">Hoàn thành</string>
    <string name="change_password">Đổi mật khẩu</string>
    <string name="change_avatar">Đổi avatar</string>
    <string name="write_diary">Viết nhật ký</string>
    <string name="logout">Đăng xuất</string>
    <string name="save">Lưu</string>
    <string name="cancel">Hủy</string>
</resources>''',

    "app/src/main/res/values/themes.xml": '''<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.EggBlue" parent="Theme.Material3.Light.NoActionBar">
        <item name="colorPrimary">#4A90D9</item>
        <item name="android:windowBackground">#F5F7FA</item>
    </style>
</resources>''',

    "app/src/main/res/color/bottom_nav_color.xml": '''<selector xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:color="#4A90D9" android:state_checked="true"/>
    <item android:color="#999999"/>
</selector>''',

    "app/src/main/res/menu/bottom_nav_menu.xml": '''<menu xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:id="@+id/nav_home" android:icon="@android:drawable/ic_menu_today" android:title="@string/home"/>
    <item android:id="@+id/nav_diary" android:icon="@android:drawable/ic_menu_edit" android:title="@string/diary"/>
    <item android:id="@+id/nav_ai" android:icon="@android:drawable/ic_menu_help" android:title="@string/ai_chat"/>
    <item android:id="@+id/nav_account" android:icon="@android:drawable/ic_menu_myplaces" android:title="@string/account"/>
</menu>''',

    "app/src/main/java/com/eggblue/app/utils/FirebaseHelper.kt": '''package com.eggblue.app.utils
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
}''',

    "app/src/main/java/com/eggblue/app/models/Task.kt": '''package com.eggblue.app.models
import java.io.Serializable
data class Task(
    val id: String = "", val name: String = "", val note: String = "",
    val startHour: Int = 0, val startMinute: Int = 0, val startDay: Int = 0,
    val startMonth: Int = 0, val startYear: Int = 0, var status: Int = 1, var createdAt: Long = 0L
) : Serializable {
    companion object { const val STATUS_COMPLETED = 0; const val STATUS_IN_PROGRESS = 1; const val STATUS_OVERDUE = 2 }
    fun getBgColor() = when(status) { STATUS_COMPLETED -> "#4CAF50"; STATUS_IN_PROGRESS -> "#FFC107"; else -> "#F44336" }
    fun getStatusText() = when(status) { STATUS_COMPLETED -> "Hoàn thành"; STATUS_IN_PROGRESS -> "Đang diễn ra"; else -> "Quá hạn" }
}''',

    "app/src/main/java/com/eggblue/app/models/Diary.kt": '''package com.eggblue.app.models
data class Diary(val id: String = "", val content: String = "", val day: Int = 0, val month: Int = 0, val year: Int = 0, val createdAt: Long = 0L)''',

    "app/src/main/java/com/eggblue/app/MainActivity.kt": '''package com.eggblue.app
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.eggblue.app.databinding.ActivityMainBinding
import com.eggblue.app.fragments.*
class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, HomeFragment()).commit()
        binding.bottomNav.setOnItemSelectedListener { item ->
            when(item.itemId) {
                com.eggblue.app.R.id.nav_home -> { supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, HomeFragment()).commit(); true }
                com.eggblue.app.R.id.nav_diary -> { supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, DiaryFragment()).commit(); true }
                com.eggblue.app.R.id.nav_ai -> { supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, AIChatFragment()).commit(); true }
                com.eggblue.app.R.id.nav_account -> { supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, AccountFragment()).commit(); true }
                else -> false
            }
        }
    }
}''',

    "app/src/main/java/com/eggblue/app/activities/LoginActivity.kt": '''package com.eggblue.app.activities
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.eggblue.app.MainActivity
import com.eggblue.app.databinding.ActivityLoginBinding
import com.eggblue.app.utils.FirebaseHelper
class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        if(FirebaseHelper.currentUserUid != null) { startActivity(Intent(this, MainActivity::class.java)); finish(); return }
        binding.btnLogin.setOnClickListener {
            val e = binding.etEmail.text.toString().trim()
            val p = binding.etPassword.text.toString().trim()
            if(e.isEmpty() || p.isEmpty()) { Toast.makeText(this, "Vui lòng nhập đủ thông tin", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            FirebaseHelper.auth.signInWithEmailAndPassword(e, p).addOnCompleteListener { t ->
                if(t.isSuccessful) { startActivity(Intent(this, MainActivity::class.java)); finish() }
                else Toast.makeText(this, "Lỗi: ${t.exception?.message}", Toast.LENGTH_SHORT).show()
            }
        }
        binding.tvRegister.setOnClickListener { startActivity(Intent(this, RegisterActivity::class.java)) }
    }
}''',

    "app/src/main/java/com/eggblue/app/activities/RegisterActivity.kt": '''package com.eggblue.app.activities
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.eggblue.app.MainActivity
import com.eggblue.app.databinding.ActivityRegisterBinding
import com.eggblue.app.utils.FirebaseHelper
class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)
        binding.btnRegister.setOnClickListener {
            val e = binding.etEmail.text.toString().trim()
            val p = binding.etPassword.text.toString().trim()
            val cp = binding.etConfirmPassword.text.toString().trim()
            if(e.isEmpty() || p.length < 6) { Toast.makeText(this, "Email sai hoặc mật khẩu <6 ký tự", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            if(p != cp) { Toast.makeText(this, "Mật khẩu không khớp", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            FirebaseHelper.auth.createUserWithEmailAndPassword(e, p).addOnCompleteListener { t ->
                if(t.isSuccessful) {
                    FirebaseHelper.db.collection("users").document(FirebaseHelper.currentUserUid!!).set(mapOf("email" to e))
                    startActivity(Intent(this, MainActivity::class.java)); finish()
                } else Toast.makeText(this, "Lỗi: ${t.exception?.message}", Toast.LENGTH_SHORT).show()
            }
        }
        binding.tvBackToLogin.setOnClickListener { finish() }
    }
}''',

    "app/src/main/java/com/eggblue/app/fragments/HomeFragment.kt": '''package com.eggblue.app.fragments
import android.app.AlertDialog
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.eggblue.app.adapters.TaskAdapter
import com.eggblue.app.databinding.DialogAddTaskBinding
import com.eggblue.app.databinding.DialogCompleteTaskBinding
import com.eggblue.app.databinding.FragmentHomeBinding
import com.eggblue.app.models.Task
import com.eggblue.app.utils.FirebaseHelper
import java.util.*
class HomeFragment : Fragment() {
    private lateinit var binding: FragmentHomeBinding
    private lateinit var adapter: TaskAdapter
    private val taskList = mutableListOf<Task>()
    private var selDay=0; var selMonth=0; var selYear=0; var selHour=0; var selMin=0; var dateOk=false; var timeOk=false
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding = FragmentHomeBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v, s)
        adapter = TaskAdapter(taskList, { task -> if(task.status==Task.STATUS_IN_PROGRESS) showComplete(task) }, { showAdd() })
        binding.rvTasks.layoutManager = LinearLayoutManager(requireContext()); binding.rvTasks.adapter = adapter
        val uid = FirebaseHelper.currentUserUid ?: return
        FirebaseHelper.getUserTaskCollection(uid).addSnapshotListener { sn, err ->
            if(err!=null) return@addSnapshotListener
            taskList.clear()
            for(d in sn?: emptyList()) {
                val t = d.toObject(Task::class.java).copy(id=d.id)
                if(t.status==Task.STATUS_IN_PROGRESS) {
                    val now=Calendar.getInstance(); val tc=Calendar.getInstance().apply{set(t.startYear,t.startMonth-1,t.startDay,t.startHour,t.startMinute)}
                    if(now.after(tc)) { t.status=Task.STATUS_OVERDUE; d.reference.update("status",2) }
                }
                taskList.add(t)
            }
            taskList.sortWith(compareBy<Task>{it.startYear}.thenBy{it.startMonth}.thenBy{it.startDay}.thenBy{it.startHour}.thenBy{it.startMinute})
            adapter.updateTasks(taskList)
        }
    }
    private fun showAdd() {
        val b = DialogAddTaskBinding.inflate(layoutInflater); val d = AlertDialog.Builder(requireContext()).setView(b.root).setCancelable(false).create()
        dateOk=false; timeOk=false
        b.btnSelectDate.setOnClickListener {
            val c=Calendar.getInstance(); DatePickerDialog(requireContext(),{_,y,m,dy->selDay=dy;selMonth=m+1;selYear=y;dateOk=true;b.tvSelectedDate.text=String.format("%02d/%02d/%d",dy,m+1,y)},c.get(Calendar.YEAR),c.get(Calendar.MONTH),c.get(Calendar.DAY_OF_MONTH)).show()
        }
        b.btnSelectTime.setOnClickListener {
            val c=Calendar.getInstance(); TimePickerDialog(requireContext(),{_,h,m->selHour=h;selMin=m;timeOk=true;b.tvSelectedTime.text=String.format("%02d:%02d",h,m)},c.get(Calendar.HOUR_OF_DAY),c.get(Calendar.MINUTE),true).show()
        }
        b.btnCancel.setOnClickListener { d.dismiss() }
        b.btnSave.setOnClickListener {
            val nm=b.etTaskName.text.toString().trim(); val nt=b.etTaskNote.text.toString().trim()
            if(nm.isEmpty()) { Toast.makeText(requireContext(),"Nhập tên task",Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            if(!dateOk||!timeOk) { Toast.makeText(requireContext(),"Chọn ngày giờ",Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            val now=Calendar.getInstance(); val tc=Calendar.getInstance().apply{set(selYear,selMonth-1,selDay,selHour,selMin)}
            if(tc.before(now)) { Toast.makeText(requireContext(),"Thời gian không hợp lệ",Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            val uid=FirebaseHelper.currentUserUid?:return@setOnClickListener
            FirebaseHelper.getUserTaskCollection(uid).add(Task(name=nm,note=nt,startHour=selHour,startMinute=selMin,startDay=selDay,startMonth=selMonth,startYear=selYear,status=1,createdAt=System.currentTimeMillis()))
                .addOnSuccessListener{ Toast.makeText(requireContext(),"Đã thêm!",Toast.LENGTH_SHORT).show(); d.dismiss() }
                .addOnFailureListener{ Toast.makeText(requireContext(),"Lỗi: ${it.message}",Toast.LENGTH_SHORT).show() }
        }
        d.show()
    }
    private fun showComplete(task: Task) {
        val b = DialogCompleteTaskBinding.inflate(layoutInflater); b.tvTaskInfo.text="Task: ${task.name}\\nGhi chú: ${task.note}"
        val d = AlertDialog.Builder(requireContext()).setView(b.root).create()
        b.btnNo.setOnClickListener { d.dismiss() }
        b.btnYes.setOnClickListener {
            val uid=FirebaseHelper.currentUserUid?:return@setOnClickListener
            FirebaseHelper.getUserTaskCollection(uid).document(task.id).update("status",0)
                .addOnSuccessListener{ Toast.makeText(requireContext(),"✅ Hoàn thành!",Toast.LENGTH_SHORT).show(); d.dismiss() }
        }
        d.show()
    }
}''',

    "app/src/main/java/com/eggblue/app/fragments/DiaryFragment.kt": '''package com.eggblue.app.fragments
import android.os.Bundle; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup
import androidx.fragment.app.Fragment; import androidx.recyclerview.widget.LinearLayoutManager
import com.eggblue.app.adapters.DiaryAdapter; import com.eggblue.app.databinding.FragmentDiaryBinding; import com.eggblue.app.models.Diary; import com.eggblue.app.utils.FirebaseHelper
class DiaryFragment : Fragment() {
    private lateinit var binding: FragmentDiaryBinding; private lateinit var adapter: DiaryAdapter; private val list = mutableListOf<Diary>()
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentDiaryBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v,s)
        adapter = DiaryAdapter(list) { d -> parentFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, ViewDiaryFragment().apply{arguments=Bundle().apply{putSerializable("diary",d)}}).addToBackStack(null).commit() }
        binding.rvDiaries.layoutManager=LinearLayoutManager(requireContext()); binding.rvDiaries.adapter=adapter
        binding.btnWriteDiary.setOnClickListener { parentFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, WriteDiaryFragment()).addToBackStack(null).commit() }
        val uid=FirebaseHelper.currentUserUid?:return
        FirebaseHelper.getUserDiaryCollection(uid).orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING).addSnapshotListener { sn, err ->
            if(err!=null) return@addSnapshotListener
            list.clear(); for(d in sn?: emptyList()) list.add(d.toObject(Diary::class.java).copy(id=d.id))
            adapter.updateDiaries(list)
        }
    }
}''',

    "app/src/main/java/com/eggblue/app/fragments/WriteDiaryFragment.kt": '''package com.eggblue.app.fragments
import android.os.Bundle; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup; import android.widget.Toast
import androidx.fragment.app.Fragment; import com.eggblue.app.databinding.FragmentWriteDiaryBinding; import com.eggblue.app.models.Diary; import com.eggblue.app.utils.FirebaseHelper; import java.util.Calendar
class WriteDiaryFragment : Fragment() {
    private lateinit var binding: FragmentWriteDiaryBinding
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentWriteDiaryBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v,s)
        val n=Calendar.getInstance(); binding.tvCurrentDate.text="Hôm nay: ${String.format("%02d/%02d/%d",n.get(Calendar.DAY_OF_MONTH),n.get(Calendar.MONTH)+1,n.get(Calendar.YEAR))}"
        binding.btnSaveDiary.setOnClickListener {
            val c=binding.etDiaryContent.text.toString().trim(); if(c.isEmpty()) { Toast.makeText(requireContext(),"Nhập nội dung",Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            FirebaseHelper.getUserDiaryCollection(FirebaseHelper.currentUserUid!!).add(Diary(content=c,day=n.get(Calendar.DAY_OF_MONTH),month=n.get(Calendar.MONTH)+1,year=n.get(Calendar.YEAR),createdAt=System.currentTimeMillis()))
                .addOnSuccessListener{ Toast.makeText(requireContext(),"Đã lưu!",Toast.LENGTH_SHORT).show(); parentFragmentManager.popBackStack() }
        }
    }
}''',

    "app/src/main/java/com/eggblue/app/fragments/ViewDiaryFragment.kt": '''package com.eggblue.app.fragments
import android.os.Bundle; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup
import androidx.fragment.app.Fragment; import com.eggblue.app.databinding.FragmentViewDiaryBinding; import com.eggblue.app.models.Diary
class ViewDiaryFragment : Fragment() {
    private lateinit var binding: FragmentViewDiaryBinding
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentViewDiaryBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v,s)
        val d=arguments?.getSerializable("diary") as? Diary ?: return
        binding.tvDiaryDate.text="📅 ${String.format("%02d/%02d/%d",d.day,d.month,d.year)}"; binding.tvDiaryContent.text=d.content
    }
}''',

    "app/src/main/java/com/eggblue/app/fragments/AIChatFragment.kt": '''package com.eggblue.app.fragments
import android.os.Bundle; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup
import androidx.fragment.app.Fragment; import com.eggblue.app.databinding.FragmentAiChatBinding
class AIChatFragment : Fragment() {
    private lateinit var binding: FragmentAiChatBinding
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentAiChatBinding.inflate(i,c,false); return binding.root }
}''',

    "app/src/main/java/com/eggblue/app/fragments/AccountFragment.kt": '''package com.eggblue.app.fragments
import android.app.Activity; import android.app.AlertDialog; import android.content.Intent; import android.graphics.Bitmap; import android.graphics.BitmapFactory
import android.net.Uri; import android.os.Bundle; import android.provider.MediaStore; import android.util.Base64; import android.view.LayoutInflater
import android.view.View; import android.view.ViewGroup; import android.widget.EditText; import android.widget.Toast; import androidx.fragment.app.Fragment
import com.eggblue.app.activities.LoginActivity; import com.eggblue.app.databinding.FragmentAccountBinding; import com.eggblue.app.utils.FirebaseHelper; import java.io.ByteArrayOutputStream
class AccountFragment : Fragment() {
    private lateinit var binding: FragmentAccountBinding; private var curBase64=""
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentAccountBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v,s); binding.tvEmail.text=FirebaseHelper.currentUserEmail
        val uid=FirebaseHelper.currentUserUid?:return
        FirebaseHelper.db.collection("users").document(uid).addSnapshotListener { sn, err ->
            if(err!=null||sn==null||!sn.exists()) return@addSnapshotListener
            curBase64=sn.getString("avatarBase64")?:""
            if(curBase64.isNotEmpty()) { val by=Base64.decode(curBase64,Base64.DEFAULT); binding.imgAvatar.setImageBitmap(BitmapFactory.decodeByteArray(by,0,by.size)) }
        }
        binding.btnChangeAvatar.setOnClickListener { startActivityForResult(Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI), 1001) }
        binding.btnChangePassword.setOnClickListener {
            val et=EditText(requireContext()); et.hint="Mật khẩu mới"; et.inputType=android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
            AlertDialog.Builder(requireContext()).setTitle("Đổi mật khẩu").setView(et).setPositiveButton("Lưu"){_,_->
                val np=et.text.toString(); if(np.length<6) { Toast.makeText(requireContext(),"≥6 ký tự",Toast.LENGTH_SHORT).show(); return@setPositiveButton }
                FirebaseHelper.currentUser?.updatePassword(np)?.addOnSuccessListener{ Toast.makeText(requireContext(),"Thành công",Toast.LENGTH_SHORT).show() }
            }.setNegativeButton("Hủy",null).show()
        }
        binding.btnLogout.setOnClickListener {
            FirebaseHelper.auth.signOut(); val i=Intent(requireContext(),LoginActivity::class.java); i.flags=Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(i); requireActivity().finish()
        }
    }
    @Deprecated("Deprecated")
    override fun onActivityResult(req: Int, res: Int, data: Intent?) {
        super.onActivityResult(req,res,data)
        if(req==1001 && res==Activity.RESULT_OK && data!=null) {
            val uri=data.data?:return; val inp=requireContext().contentResolver.openInputStream(uri)
            val bm=Bitmap.createScaledBitmap(BitmapFactory.decodeStream(inp),512,512,true)
            val baos=ByteArrayOutputStream(); bm.compress(Bitmap.CompressFormat.JPEG,70,baos); val b64=Base64.encodeToString(baos.toByteArray(),Base64.DEFAULT)
            binding.imgAvatar.setImageBitmap(bm)
            FirebaseHelper.db.collection("users").document(FirebaseHelper.currentUserUid!!).update("avatarBase64",b64).addOnSuccessListener{ Toast.makeText(requireContext(),"Đã cập nhật avatar",Toast.LENGTH_SHORT).show() }
        }
    }
}''',

    "app/src/main/java/com/eggblue/app/adapters/TaskAdapter.kt": '''package com.eggblue.app.adapters
import android.graphics.Color; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup; import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView; import com.eggblue.app.R; import com.eggblue.app.models.Task
class TaskAdapter(private var list: List<Task>, private val onClick: (Task) -> Unit, private val onAdd: () -> Unit) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    override fun getItemViewType(p: Int) = if(p==0) 0 else 1
    override fun onCreateViewHolder(p: ViewGroup, vt: Int) = if(vt==0) { val v=LayoutInflater.from(p.context).inflate(R.layout.item_task_header,p,false); HeaderVH(v,onAdd) } else { val v=LayoutInflater.from(p.context).inflate(R.layout.item_task,p,false); TaskVH(v,onClick) }
    override fun onBindViewHolder(h: RecyclerView.ViewHolder, p: Int) { if(h is TaskVH) h.bind(list[p-1]) }
    override fun getItemCount() = list.size + 1
    fun updateTasks(nl: List<Task>) { list=nl; notifyDataSetChanged() }
    class HeaderVH(v: View, c: () -> Unit) : RecyclerView.ViewHolder(v) { init { v.setOnClickListener { c() } } }
    class TaskVH(v: View, private val c: (Task) -> Unit) : RecyclerView.ViewHolder(v) {
        private val n: TextView=v.findViewById(R.id.tvTaskName); private val nt: TextView=v.findViewById(R.id.tvTaskNote)
        private val t: TextView=v.findViewById(R.id.tvTaskTime); private val s: TextView=v.findViewById(R.id.tvTaskStatus); private val card: View=v.findViewById(R.id.cardTask)
        fun bind(tk: Task) {
            n.text=tk.name; nt.text=if(tk.note.isNotEmpty()) tk.note else "Không ghi chú"; t.text=String.format("%02d:%02d | %02d/%02d/%d",tk.startHour,tk.startMinute,tk.startDay,tk.startMonth,tk.startYear); s.text=tk.getStatusText()
            card.setCardBackgroundColor(Color.parseColor(tk.getBgColor())); itemView.setOnClickListener { c(tk) }
        }
    }
}''',

    "app/src/main/java/com/eggblue/app/adapters/DiaryAdapter.kt": '''package com.eggblue.app.adapters
import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup; import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView; import com.eggblue.app.R; import com.eggblue.app.models.Diary
class DiaryAdapter(private var list: List<Diary>, private val onClick: (Diary) -> Unit) : RecyclerView.Adapter<DiaryAdapter.VH>() {
    override fun onCreateViewHolder(p: ViewGroup, vt: Int) = VH(LayoutInflater.from(p.context).inflate(R.layout.item_diary,p,false), onClick)
    override fun onBindViewHolder(h: VH, p: Int) = h.bind(list[p])
    override fun getItemCount() = list.size
    fun updateDiaries(nl: List<Diary>) { list=nl; notifyDataSetChanged() }
    class VH(v: View, private val c: (Diary) -> Unit) : RecyclerView.ViewHolder(v) {
        private val d: TextView=v.findViewById(R.id.tvDiaryDate); private val p: TextView=v.findViewById(R.id.tvDiaryPreview)
        fun bind(di: Diary) { d.text=String.format("%02d/%02d/%d",di.day,di.month,di.year); p.text=if(di.content.length>50) di.content.substring(0,50)+"..." else di.content; itemView.setOnClickListener { c(di) }
    }
}'''
}

def create():
    os.makedirs(PROJECT_DIR, exist_ok=True)
    for path, content in FILES.items():
        full = os.path.join(PROJECT_DIR, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, 'w', encoding='utf-8') as f: f.write(content)
    
    with zipfile.ZipFile(ZIP_NAME, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, _, fs in os.walk(PROJECT_DIR):
            for f in fs: zf.write(os.path.join(root, f), os.path.relpath(os.path.join(root, f), PROJECT_DIR))
    print(f"✅ Đã tạo xong: {ZIP_NAME}")
    print("📌 Đặt file google-services.json vào thư mục app/ trước khi mở Android Studio.")

if __name__ == "__main__": create()