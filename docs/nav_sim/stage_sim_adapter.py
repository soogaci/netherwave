#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Адаптер Stage → твоя навигация.
Переводит /odom в /Odometry и публикует нужные TF (map, odom, base_link, robot_foot_init, body_foot, body),
чтобы move_base и твои конфиги работали без изменений.
"""
import rospy
from nav_msgs.msg import Odometry
from geometry_msgs.msg import TransformStamped
import tf2_ros


def odom_cb(msg):
    out = Odometry()
    out.header = msg.header
    out.child_frame_id = "body"
    out.pose = msg.pose
    out.twist = msg.twist
    pub_odom.publish(out)


if __name__ == "__main__":
    rospy.init_node("stage_sim_adapter", anonymous=False)
    pub_odom = rospy.Publisher("/Odometry", Odometry, queue_size=1)
    sub_odom = rospy.Subscriber("/odom", Odometry, odom_cb, queue_size=1)

    static_broadcaster = tf2_ros.StaticTransformBroadcaster()
    transforms = []

    # map -> odom (в симе карта и одометрия совпадают)
    t = TransformStamped()
    t.header.frame_id = "map"
    t.child_frame_id = "odom"
    t.transform.translation.x = 0
    t.transform.translation.y = 0
    t.transform.translation.z = 0
    t.transform.rotation.x = 0
    t.transform.rotation.y = 0
    t.transform.rotation.z = 0
    t.transform.rotation.w = 1.0
    transforms.append(t)

    # map -> camera_init (как на реальном стеке)
    t2 = TransformStamped()
    t2.header.frame_id = "map"
    t2.child_frame_id = "camera_init"
    t2.transform.translation.x = 0
    t2.transform.translation.y = 0
    t2.transform.translation.z = 0
    t2.transform.rotation.x = 0
    t2.transform.rotation.y = 0
    t2.transform.rotation.z = 0
    t2.transform.rotation.w = 1.0
    transforms.append(t2)

    # base_link -> robot_foot_init -> body_foot -> body (как на роботе)
    for parent, child in [
        ("base_link", "robot_foot_init"),
        ("robot_foot_init", "body_foot"),
        ("body_foot", "body"),
    ]:
        tr = TransformStamped()
        tr.header.frame_id = parent
        tr.child_frame_id = child
        tr.transform.translation.x = 0
        tr.transform.translation.y = 0
        tr.transform.translation.z = 0
        tr.transform.rotation.x = 0
        tr.transform.rotation.y = 0
        tr.transform.rotation.z = 0
        tr.transform.rotation.w = 1.0
        transforms.append(tr)

    rate = rospy.Rate(10)
    while not rospy.is_shutdown():
        now = rospy.Time.now()
        for tr in transforms:
            tr.header.stamp = now
        static_broadcaster.sendTransform(transforms)
        rate.sleep()
