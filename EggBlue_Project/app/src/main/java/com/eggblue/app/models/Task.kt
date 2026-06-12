package com.eggblue.app.models
import java.io.Serializable
data class Task(
    val id: String = "", val name: String = "", val note: String = "",
    val startHour: Int = 0, val startMinute: Int = 0, val startDay: Int = 0,
    val startMonth: Int = 0, val startYear: Int = 0, var status: Int = 1, var createdAt: Long = 0L
) : Serializable {
    companion object { const val STATUS_COMPLETED = 0; const val STATUS_IN_PROGRESS = 1; const val STATUS_OVERDUE = 2 }
    fun getBgColor() = when(status) { STATUS_COMPLETED -> "#4CAF50"; STATUS_IN_PROGRESS -> "#FFC107"; else -> "#F44336" }
    fun getStatusText() = when(status) { STATUS_COMPLETED -> "Hoàn thành"; STATUS_IN_PROGRESS -> "Đang diễn ra"; else -> "Quá hạn" }
}