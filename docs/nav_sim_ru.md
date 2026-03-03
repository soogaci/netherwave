# Симуляция навигации (проверка без робота)

Инструкция для проверки навигации (move_base и твои параметры) в 2D-симуляторе **Stage**. Робот не нужен — всё запускается на компе в ROS.

**Готовые файлы** лежат в папке `docs/nav_sim/`: `stage_sim_adapter.py` и `nav_sim.launch`. Их можно скопировать в свой ROS-пакет и только подставить свой launch move_base в конец `nav_sim.launch`.

---

## Что понадобится

1. **ROS Noetic** (или твоя версия ROS) и **catkin**-воркспейс, где уже есть:
   - пакет с навигацией (move_base, sentry_nav или аналог);
   - твои конфиги: `base_local_planner_params.yaml`, `local_costmap_params.yaml`, `global_costmap_params.yaml` и т.д.
2. **Stage** — 2D-симулятор (карта, лазер, одометрия):
   ```bash
   sudo apt install ros-noetic-stage-ros
   ```
3. Два файла из этой инструкции: **адаптер** (Python) и **launch** (XML). Их нужно положить в твой ROS-проект и запускать оттуда.

---

## Шаг 1. Куда положить файлы

В том же ROS-воркспейсе, где у тебя навигация:

- Создай пакет для симуляции (если ещё нет), например:
  ```bash
  cd ~/catkin_ws/src
  catkin_create_pkg nav_sim rospy nav_msgs geometry_msgs tf2_ros std_msgs
  cd nav_sim
  mkdir -p scripts launch
  ```
- Или просто папки `scripts` и `launch` в любом существующем пакете, где удобно.

Дальше:
- **Скрипт адаптера** сохрани как `scripts/stage_sim_adapter.py`.
- **Launch-файл** сохрани как `launch/nav_sim.launch`.

После правок сделай:
```bash
chmod +x scripts/stage_sim_adapter.py
cd ~/catkin_ws && catkin_make
source devel/setup.bash
```

---

## Шаг 2. Скрипт адаптера (полностью)

Сохрани этот код в файл **`scripts/stage_sim_adapter.py`**:

```python
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
```

---

## Шаг 3. Launch-файл (полностью)

Сохрани этот XML в файл **`launch/nav_sim.launch`**:

```xml
<launch>
  <param name="/use_sim_time" value="true"/>

  <!-- Stage: карта, /scan, /odom, TF odom->base_link -->
  <node pkg="stage_ros" type="stageros" name="stageros"
        args="$(find stage_ros)/worlds/willow-four-erratics.world"/>

  <!-- Адаптер: /odom -> /Odometry и TF под твои фреймы -->
  <node pkg="nav_sim" type="stage_sim_adapter.py" name="stage_sim_adapter"/>

  <!-- Ниже подставь свои пакет и launch move_base (sentry_nav и т.д.) -->
  <!-- Пример: -->
  <!-- <include file="$(find sentry_nav)/launch/sentry_movebase.launch"/> -->
  <!-- Или по отдельности: move_base + trans_tf_2d + velocity_smoother + invert_angular_z -->
</launch>
```

**Важно:** в конце launch вместо комментария с `sentry_nav` подставь **реальный** include твоего навигационного launch (тот, которым запускаешь move_base на роботе). Если move_base и остальные ноды запускаются разными launch-файлами — добавь сюда все нужные `<include>` или `<node>`.

---

## Шаг 4. Как запускать

1. Запусти симуляцию и навигацию одним launch:
   ```bash
   roslaunch nav_sim nav_sim.launch
   ```
2. Открой RViz, подставь карту из топика `/map`, добавь LaserScan (`/scan`), Odometry, Path (path от move_base), при необходимости Map (costmaps). Fixed Frame поставь `map`.
3. В 2D Nav Goal задай цель — робот в симе должен строить путь и «ехать».

Если в твоём launch move_base уже поднимается с параметром `use_sim_time:=true`, убедись, что в `nav_sim.launch` он не переопределяется на `false`.

---

## Если чего-то нет

- **Нет пакета stage_ros:**  
  `sudo apt install ros-noetic-stage-ros`
- **Другой мир Stage:**  
  вместо `willow-four-erratics.world` укажи другой `.world` из `$(find stage_ros)/worlds/`.
- **Фреймы не сходятся:**  
  проверь в RViz, какие фреймы публикуются (`tf`), и при необходимости добавь в адаптер ещё один статический TF (по аналогии с уже описанными).

Всё выше написано полностью: ты только создаёшь два файла, вставляешь код и подставляешь свой launch move_base в конец `nav_sim.launch`.
